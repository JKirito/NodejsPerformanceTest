export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * User interface representing a user in the system
 */
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User registration request data
 */
export interface UserRegistrationRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/**
 * User login request data
 */
export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface Config {
  port: number;
  environment: 'development' | 'production' | 'test';
}
