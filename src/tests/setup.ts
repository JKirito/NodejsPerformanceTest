import express, { Express } from 'express';
import routes from '../routes';

/**
 * Creates a test instance of the Express app
 * This allows us to test the routes without starting the actual server
 */
export function createTestApp(): Express {
  const app = express();
  
  // Add middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Add routes
  app.use('/', routes);
  
  return app;
}
