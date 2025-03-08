import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requestLogger } from '../middleware/logger';

describe('Logger Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let consoleLogSpy: any;

  beforeEach(() => {
    // Mock request object
    req = {
      method: 'GET',
      originalUrl: '/test'
    };

    // Mock response object with event emitter functionality
    res = {
      statusCode: 200,
      on: vi.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          // Store the callback to call it later
          (res as any).finishCallback = callback;
        }
        return res;
      })
    };

    // Mock next function
    next = vi.fn();

    // Spy on console.log
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should call next function', () => {
    requestLogger(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('should register finish event listener', () => {
    requestLogger(req as Request, res as Response, next);
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('should log request details when request finishes', () => {
    // Mock Date.now to return consistent values for testing
    const originalDateNow = Date.now;
    const mockStartTime = 1000;
    const mockEndTime = 1200;
    
    try {
      // First call returns start time, second call returns end time
      Date.now = vi.fn()
        .mockReturnValueOnce(mockStartTime)
        .mockReturnValueOnce(mockEndTime);
      
      // Call the middleware
      requestLogger(req as Request, res as Response, next);
      
      // Simulate request finishing
      (res as any).finishCallback();
      
      // Verify log message
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`${req.method} ${req.originalUrl} - ${res.statusCode} (200ms)`)
      );
    } finally {
      // Restore original Date.now
      Date.now = originalDateNow;
    }
  });
});
