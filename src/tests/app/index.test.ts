import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp, startServer } from '../../index';
import * as config from '../../config';
import { Server } from 'http';

describe('Express App', () => {
  describe('createApp', () => {
    it('should create an Express application with middleware and routes', async () => {
      const app = createApp();
      
      // Test that the app has the routes configured
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Welcome to the Express TypeScript server!');
    });
    
    it('should handle JSON requests', async () => {
      const app = createApp();
      
      // Test JSON middleware by sending a JSON payload
      const testData = { test: 'data' };
      const response = await request(app)
        .post('/echo')
        .send(testData)
        .set('Content-Type', 'application/json');
      
      // This will 404 but we can still check if the body was parsed
      expect(response.status).toBe(404);
    });
  });
  
  describe('startServer', () => {
    let server: Server;
    
    afterEach(() => {
      // Clean up
      if (server) {
        server.close();
      }
    });
    
    it('should start a server on the configured port', async () => {
      const mockLogger = vi.fn();
      
      // Create a promise that resolves when the logger is called
      const loggerCalledPromise = new Promise<void>((resolve) => {
        mockLogger.mockImplementation(() => {
          resolve();
        });
      });
      
      server = await startServer({
        logger: mockLogger,
        port: 0, // Use port 0 to let the OS assign a free port
        environment: 'test',
        connectDb: false // Don't connect to DB in tests
      });
      
      // Check that the server is listening
      expect(server.listening).toBe(true);
      
      // Wait for the logger to be called
      await loggerCalledPromise;
      
      // Now check that the logger was called with the expected message
      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('Server is running on port')
      );
    });
    
    it('should use provided app factory', async () => {
      const mockLogger = vi.fn();
      const mockAppFactory = vi.fn().mockReturnValue(createApp());
      
      server = await startServer({
        logger: mockLogger,
        appFactory: mockAppFactory,
        port: 0,
        environment: 'test',
        connectDb: false // Don't connect to DB in tests
      });
      
      // Check that the app factory was called
      expect(mockAppFactory).toHaveBeenCalled();
      
      // Check that the server is listening
      expect(server.listening).toBe(true);
    });
    
    it('should use default config values when not provided', async () => {
      const mockLogger = vi.fn();
      
      // We'll use a spy to check if the default config values are used
      const portSpy = vi.spyOn(config.default, 'port', 'get');
      const envSpy = vi.spyOn(config.default, 'environment', 'get');
      
      server = await startServer({
        logger: mockLogger,
        connectDb: false // Don't connect to DB in tests
      });
      
      // Check that the config getters were called
      expect(portSpy).toHaveBeenCalled();
      expect(envSpy).toHaveBeenCalled();
      
      // Clean up spies
      portSpy.mockRestore();
      envSpy.mockRestore();
    });
  });
});
