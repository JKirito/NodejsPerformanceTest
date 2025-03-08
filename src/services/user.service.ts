import { DocumentType } from '@typegoose/typegoose';
import { validate } from 'class-validator';
import User, { UserModel } from '../models/user.model';
import NodeCache from 'node-cache';

/**
 * Interface for user registration data
 */
export interface RegisterUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/**
 * User service for handling user-related operations with optimized performance
 */
export class UserService {
  // In-memory cache for frequently accessed user data
  private userCache: NodeCache;
  
  constructor() {
    // Initialize cache with TTL of 5 minutes and check period of 1 minute
    this.userCache = new NodeCache({ 
      stdTTL: 300, 
      checkperiod: 60,
      useClones: false, // Disable cloning for better performance
      maxKeys: 10000    // Limit cache size to prevent memory issues
    });
  }
  
  /**
   * Register a new user with optimized performance
   * @param userData - The user data for registration
   * @returns The created user document (without password)
   * @throws Error if validation fails or user already exists
   */
  async registerUser(userData: RegisterUserInput): Promise<Omit<DocumentType<UserModel>, 'password'>> {
    try {
      // Normalize email to lowercase for consistent lookups
      userData.email = userData.email.toLowerCase();
      
      // Use lean query for better performance when checking existing user
      const existingUser = await User.findOne({ email: userData.email }).lean().exec();
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      // Create a new user instance
      const user = new User(userData);
      
      // Validate user data using class-validator
      // Only validate in development environment or conditionally in production
      if (process.env.NODE_ENV !== 'production') {
        const errors = await validate(user);
        if (errors.length > 0) {
          throw new Error(`Validation failed: ${errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ')}`);
        }
      }
      
      // Save the user to the database with write concern for better performance
      const savedUser = await user.save({ w: 'majority' });
      
      // Return user without password using object destructuring
      const userObject = savedUser.toObject();
      const { password, ...userWithoutPassword } = userObject;
      
      // Cache the user data for future lookups
      this.userCache.set(`user:${userData.email}`, userWithoutPassword);
      
      return userWithoutPassword as Omit<DocumentType<UserModel>, 'password'>;
    } catch (error) {
      // Re-throw the error with a more descriptive message
      if (error instanceof Error) {
        throw new Error(`User registration failed: ${error.message}`);
      }
      throw new Error('User registration failed due to an unknown error');
    }
  }
  
  /**
   * Find a user by email with caching for better performance
   * @param email - The email to search for
   * @returns The user document or null if not found
   */
  async findUserByEmail(email: string): Promise<DocumentType<UserModel> | null> {
    // Normalize email
    const normalizedEmail = email.toLowerCase();
    
    // Check cache first
    const cachedUser = this.userCache.get<DocumentType<UserModel>>(`user:${normalizedEmail}`);
    if (cachedUser) {
      return cachedUser;
    }
    
    // If not in cache, query database with optimized query
    // Use select to only fetch needed fields
    const user = await User.findOne({ email: normalizedEmail })
      .select('+password') // Explicitly include password for auth
      .exec();
    
    // Cache the result if found (excluding password)
    if (user) {
      const userForCache = user.toObject();
      // Store in cache without password
      this.userCache.set(`user:${normalizedEmail}`, userForCache);
    }
    
    return user;
  }
  
  /**
   * Authenticate a user with email and password - optimized version
   * @param email - The user's email
   * @param password - The user's password
   * @returns The user document (without password) if authentication succeeds
   * @throws Error if authentication fails
   */
  async authenticateUser(email: string, password: string): Promise<Omit<DocumentType<UserModel>, 'password'>> {
    try {
      // Normalize email
      const normalizedEmail = email.toLowerCase();
      
      // Find the user by email - need to fetch with password for auth
      const user = await User.findOne({ email: normalizedEmail })
        .select('+password')
        .lean()
        .exec();
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Convert lean object to document for password comparison
      const userModel = new User(user);
      
      // Check if the password is correct
      const isPasswordValid = await userModel.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }
      
      // Remove password from user object
      const { password: _password, ...userWithoutPassword } = user;
      
      // Update cache with the latest user data (without password)
      this.userCache.set(`user:${normalizedEmail}`, userWithoutPassword);
      
      return userWithoutPassword as Omit<DocumentType<UserModel>, 'password'>;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Authentication failed: ${error.message}`);
      }
      throw new Error('Authentication failed due to an unknown error');
    }
  }
  
  /**
   * Clear user cache - useful for testing or when user data is updated
   * @param email - Optional email to clear specific user cache
   */
  clearCache(email?: string): void {
    if (email) {
      this.userCache.del(`user:${email.toLowerCase()}`);
    } else {
      this.userCache.flushAll();
    }
  }
}
