import { describe, it, expect } from 'vitest';
import config from '../index';

describe('Config', () => {
  it('should have default values', () => {
    expect(config.port).toBe(3000);
    expect(config.environment).toBe('test');
  });
  it('should have custom values', () => {
    process.env.PORT = '8080';
    process.env.NODE_ENV = 'development';
    expect(config.port).toBe(8080);
    expect(config.environment).toBe('development');
  });
  it('should have default values after reset', () => {
    process.env.PORT = undefined;
    process.env.NODE_ENV = undefined;
    expect(config.port).toBe(3000);
    expect(config.environment).toBe('development');
  });
});
