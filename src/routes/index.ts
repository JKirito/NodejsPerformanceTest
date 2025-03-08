import express, { Router, Request, Response } from 'express';
import { ApiResponse } from '../types';
import userRoutes from './user.routes';
import itemRoutes from './item.routes';

const router: Router = express.Router();

// Home route
router.get('/', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    message: 'Welcome to the Express TypeScript server!',
    data: {
      timestamp: new Date().toISOString()
    }
  };
  
  res.json(response);
});

// Health check route
router.get('/health', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    message: 'Server is healthy',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  };
  
  res.json(response);
});

// Mount user routes
router.use('/users', userRoutes);

// Mount item routes
router.use('/items', itemRoutes);

export default router;
