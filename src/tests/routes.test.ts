import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './setup';

describe('API Routes', () => {
  const app = createTestApp();

  describe('GET /', () => {
    it('should return welcome message with 200 status code', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Welcome to the Express TypeScript server!');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('timestamp');
    });
  });

  describe('GET /health', () => {
    it('should return health status with 200 status code', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Server is healthy');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('timestamp');
    });
  });
});
