import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../index';
import User from '../../models/user.model';

describe('User API Integration Tests', () => {
  const app = createApp();
  
  // Test user data
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'Password123!'
  };
  
  // Mock the User model
  beforeEach(() => {
    // Mock the User.findOne method
    vi.spyOn(User, 'findOne').mockImplementation((query: any) => {
      // If we're looking for an existing user during registration
      const mockedTime = vi.getMockedSystemTime();
      if (query.email === testUser.email && mockedTime !== null && mockedTime.getTime() > 0) {
        return Promise.resolve({
          _id: 'mock-user-id',
          ...testUser,
          password: 'hashed-password',
          isVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          comparePassword: () => Promise.resolve(true)
        });
      }
      return Promise.resolve(null);
    });
    
    // Mock the User.save method
    vi.spyOn(User.prototype, 'save' as any).mockImplementation((() => {
      return Promise.resolve({
        _id: 'mock-user-id',
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        email: testUser.email,
        password: 'hashed-password',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: () => ({
          _id: 'mock-user-id',
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          email: testUser.email,
          password: 'hashed-password',
          isVerified: false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });
    }) as any);
    
    // Set a mock system time for the first test
    vi.setSystemTime(0);
  });
  
  // Clean up mocks after each test
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  
  describe('POST /users/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/users/register')
        .send(testUser)
        .expect(201);
      
      // Check response structure
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data).toBeDefined();
      
      // Check user data in response
      const userData = response.body.data;
      expect(userData.firstName).toBe(testUser.firstName);
      expect(userData.lastName).toBe(testUser.lastName);
      expect(userData.email).toBe(testUser.email);
      expect(userData.password).toBeUndefined(); // Password should not be returned
      
      // Since we're mocking, we just verify that User.findOne was called with the right email
      expect(User.findOne).toHaveBeenCalledWith({ email: testUser.email });
    });
    
    it('should return 400 if required fields are missing', async () => {
      const incompleteUser = {
        firstName: 'Test',
        lastName: 'User'
        // Missing email and password
      };
      
      const response = await request(app)
        .post('/users/register')
        .send(incompleteUser)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('All fields are required');
    });
    
    it('should return 409 if user with email already exists', async () => {
      // Set a later time so the mock will return an existing user
      vi.setSystemTime(new Date(1000));
      
      // Try to create a user that will be found as existing
      const response = await request(app)
        .post('/users/register')
        .send(testUser)
        .expect(409);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });
  
  describe('POST /users/login', () => {
    beforeEach(() => {
      // Set a time that will make the mock return an existing user
      vi.setSystemTime(new Date(1000));
      
      // Mock the authenticateUser method's behavior
      vi.spyOn(User, 'findOne').mockImplementation((query: any) => {
        if (query.email === testUser.email) {
          return Promise.resolve({
            _id: 'mock-user-id',
            ...testUser,
            password: 'hashed-password',
            isVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            comparePassword: (candidatePassword: string) => {
              return Promise.resolve(candidatePassword === testUser.password);
            },
            toObject: () => ({
              _id: 'mock-user-id',
              firstName: testUser.firstName,
              lastName: testUser.lastName,
              email: testUser.email,
              isVerified: false,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          });
        }
        return Promise.resolve(null);
      });
    });
    
    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe(testUser.email);
    });
    
    it('should return 401 with incorrect password', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        })
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });
    
    it('should return 401 with non-existent email', async () => {
      const response = await request(app)
        .post('/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        })
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });
  });
});
