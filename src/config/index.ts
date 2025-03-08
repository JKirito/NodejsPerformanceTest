import { Config } from '../types';

// Use getters to read environment variables on demand
const config = {
  get port(): number {
    return process.env.PORT && process.env.PORT !== 'undefined' ? parseInt(process.env.PORT) : 3000;
  },
  get environment(): 'development' | 'production' | 'test' {
    // Handle undefined or empty NODE_ENV
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'undefined') {
      return 'development';
    }
    return process.env.NODE_ENV as 'development' | 'production' | 'test';
  }
} as Config;

export default config;
