import express, { Router } from 'express';
import { itemController } from '../controllers/item.controller';

const router: Router = express.Router();

// Create a new item
router.post('/', itemController.createItem);

// Get all items
router.get('/', itemController.getAllItems);

// Get item by ID
router.get('/:id', itemController.getItemById);

export default router;
