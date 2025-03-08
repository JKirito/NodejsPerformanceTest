import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

/**
 * Controller for handling user-related HTTP requests
 */
export class UserController {
  private userService: UserService;
  
  constructor() {
    this.userService = new UserService();
  }
  
  /**
   * Handle user registration
   * @param req - Express request object
   * @param res - Express response object
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { firstName, lastName, email, password } = req.body;
      
      // Validate required fields
      if (!firstName || !lastName || !email || !password) {
        res.status(400).json({
          success: false,
          message: 'All fields are required: firstName, lastName, email, password'
        });
        return;
      }
      
      // Register the user
      const user = await this.userService.registerUser({
        firstName,
        lastName,
        email,
        password
      });
      
      // Return success response
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user
      });
    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      // Determine appropriate status code based on error message
      let statusCode = 500;
      if (errorMessage.includes('already exists')) {
        statusCode = 409; // Conflict
      } else if (errorMessage.includes('Validation failed')) {
        statusCode = 400; // Bad Request
      }
      
      res.status(statusCode).json({
        success: false,
        message: errorMessage
      });
    }
  };
  
  /**
   * Handle user login
   * @param req - Express request object
   * @param res - Express response object
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      
      // Validate required fields
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }
      
      // Authenticate the user
      const user = await this.userService.authenticateUser(email, password);
      
      // Return success response
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: user
      });
    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      
      res.status(401).json({
        success: false,
        message: errorMessage
      });
    }
  };
}
