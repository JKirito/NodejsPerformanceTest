import mongoose from 'mongoose';
import config from '../../config';

/**
 * Database connection options with optimized settings for high performance
 */
const dbOptions: mongoose.ConnectOptions = {
  // Connection pool settings
  maxPoolSize: 100, // Increase from default 5 to handle more concurrent connections
  minPoolSize: 10,  // Keep a minimum number of connections open
  socketTimeoutMS: 45000, // Increase socket timeout
  serverSelectionTimeoutMS: 30000, // Increase server selection timeout
  heartbeatFrequencyMS: 10000, // More frequent heartbeats
  // Performance optimizations
  connectTimeoutMS: 30000,
  // Read concern for better performance
  readPreference: 'secondaryPreferred', // Prefer reading from secondary nodes when available
  // Write concern for better performance while maintaining data integrity
  w: 'majority',
  wtimeoutMS: 10000,
  // Index usage monitoring
  autoIndex: false, // Don't auto-build indexes in production
};

// Track connection status to avoid multiple connection attempts
let isConnected = false;

/**
 * Connect to MongoDB with optimized connection pooling
 * @returns A promise that resolves when connected
 */
export const connectToDatabase = async (): Promise<typeof mongoose> => {
  // If already connected, return existing connection
  if (isConnected) {
    console.log('Using existing database connection');
    return mongoose;
  }
  
  // Get MongoDB URI from environment variables or use a default
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/testing-app';
  
  try {
    // Set mongoose options for better performance
    mongoose.set('bufferCommands', false); // Disable command buffering
    
    const connection = await mongoose.connect(mongoUri, dbOptions);
    isConnected = true;
    
    // Add connection event listeners for better error handling
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });
    
    // Handle reconnection
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      isConnected = true;
    });
    
    console.log(`MongoDB connected: ${connection.connection.host} (poolSize: ${dbOptions.maxPoolSize})`);
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 * @returns A promise that resolves when disconnected
 */
export const disconnectFromDatabase = async (): Promise<void> => {
  if (!isConnected) {
    console.log('No active connection to disconnect');
    return;
  }
  
  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
  }
};

/**
 * Get the current database connection status
 * @returns True if connected, false otherwise
 */
export const isDatabaseConnected = (): boolean => {
  return isConnected && mongoose.connection.readyState === 1;
};
