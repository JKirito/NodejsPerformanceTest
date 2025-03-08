import express, { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router: Router = express.Router();
const userController = new UserController();

// User registration route
router.post('/register', userController.register);

// User login route
router.post('/login', userController.login);

export default router;
