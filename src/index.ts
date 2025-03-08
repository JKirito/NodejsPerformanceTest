import express, { Express } from 'express';
import config from './config';
import routes from './routes';
import { Server } from 'http';
import compression from 'compression';
import helmet from 'helmet';
import cluster from 'cluster';
import os from 'os';
import { connectToDatabase, disconnectFromDatabase } from './infrastructure/database/connection';

// Number of CPU cores to use for clustering
const numCPUs = os.cpus().length;

/**
 * Create and configure the Express application with performance optimizations
 */
export function createApp(): Express {
  const app: Express = express();

  // Security middleware
  app.use(helmet());
  
  // Compression middleware to reduce payload size
  app.use(compression());

  // Optimize JSON parsing with size limits
  app.use(express.json({ 
    limit: '1mb',  // Limit JSON payload size
    strict: true   // Only accept arrays and objects
  }));
  
  // Optimize URL-encoded parsing
  app.use(express.urlencoded({ 
    extended: true,
    limit: '1mb'   // Limit URL-encoded payload size
  }));
  
  // Add response time header in development
  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      const startHrTime = process.hrtime();
      res.on('finish', () => {
        const elapsedHrTime = process.hrtime(startHrTime);
        const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1000000;
        console.log(`${req.method} ${req.originalUrl} - ${elapsedTimeInMs.toFixed(3)}ms`);
      });
      next();
    });
  }

  // Use routes
  app.use('/', routes);
  
  // Add error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

  return app;
}

/**
 * Start the server with performance optimizations
 * @param options Optional configuration for the server
 * @returns The HTTP server instance
 */
export async function startServer(options: { 
  logger?: typeof console.log,
  appFactory?: () => Express,
  port?: number,
  environment?: string,
  connectDb?: boolean,
  enableClustering?: boolean
} = {}): Promise<Server> {
  // Use provided dependencies or defaults
  const log = options.logger || console.log;
  const port = options.port !== undefined ? options.port : config.port;
  const env = options.environment || config.environment;
  const shouldConnectDb = options.connectDb !== undefined ? options.connectDb : true;
  const enableClustering = options.enableClustering !== undefined ? options.enableClustering : env === 'production';
  
  // Use clustering in production for better performance
  if (enableClustering && cluster.isPrimary) {
    log(`Primary ${process.pid} is running`);
    
    // Fork workers based on CPU count
    const workerCount = Math.min(numCPUs, 4); // Limit to 4 workers max
    log(`Starting ${workerCount} workers...`);
    
    // Fork workers
    for (let i = 0; i < workerCount; i++) {
      cluster.fork();
    }
    
    // Handle worker exit and restart
    cluster.on('exit', (worker, code, signal) => {
      log(`Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
      cluster.fork();
    });
    
    // Return a dummy server for type compatibility
    const dummyServer = new Server();
    return dummyServer;
  } else {
    // Worker process or non-clustered mode
    const app = options.appFactory ? options.appFactory() : createApp();
    
    // Connect to MongoDB if needed
    if (shouldConnectDb) {
      try {
        await connectToDatabase();
        log('Database connected successfully');
      } catch (error) {
        log('Failed to connect to database:', error);
        throw error;
      }
    }
    
    // Configure server timeouts for better handling of long-running requests
    const server = app.listen(port, () => {
      const workerInfo = cluster.isWorker ? ` (Worker ${process.pid})` : '';
      log(`Server is running on port ${port} in ${env} mode${workerInfo}`);
    });
    
    // Optimize HTTP server settings
    server.keepAliveTimeout = 65000; // Slightly higher than ALB's idle timeout
    server.headersTimeout = 66000; // Slightly higher than keepAliveTimeout
    
    // Handle server errors
    server.on('error', (error: Error) => {
      log('Server error:', error);
    });
    
    return server;
  }
}

// Only start the server if this file is run directly
if (require.main === module) {
  // Enable garbage collection for better memory management
  if (global.gc) {
    setInterval(() => {
      global.gc!();
    }, 30000); // Run GC every 30 seconds
  }
  
  startServer({
    enableClustering: process.env.ENABLE_CLUSTERING === 'true'
  }).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
  
  // Handle graceful shutdown
  const shutdownGracefully = async () => {
    console.log('Shutting down gracefully...');
    try {
      await disconnectFromDatabase();
      console.log('Disconnected from database');
      
      // Allow pending requests to complete (max 30 seconds)
      setTimeout(() => {
        console.log('Forcing exit after timeout');
        process.exit(0);
      }, 30000);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };
  
  // Listen for termination signals
  process.on('SIGTERM', shutdownGracefully);
  process.on('SIGINT', shutdownGracefully);
  
  // Handle uncaught exceptions and unhandled promise rejections
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    shutdownGracefully();
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't shutdown for unhandled rejections, just log them
  });
}
