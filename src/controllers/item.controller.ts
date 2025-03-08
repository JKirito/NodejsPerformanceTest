import { Request, Response } from 'express';
import { itemService, CreateItemInput } from '../services/item.service';

/**
 * Controller for handling item-related HTTP requests
 */
export class ItemController {
  /**
   * Create a new item
   * @route POST /items
   */
  createItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const itemData: CreateItemInput = req.body;
      
      // Validate required fields
      if (!itemData.name || itemData.price === undefined) {
        res.status(400).json({
          success: false,
          message: 'Name and price are required fields'
        });
        return;
      }
      
      // Create the item
      const item = await itemService.createItem(itemData);
      
      // Return success response
      res.status(201).json({
        success: true,
        message: 'Item created successfully',
        data: item
      });
    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : 'Failed to create item';
      res.status(400).json({
        success: false,
        message: errorMessage
      });
    }
  };
  
  /**
   * Get all items
   * @route GET /items
   */
  getAllItems = async (_req: Request, res: Response): Promise<void> => {
    try {
      // Get all items
      const items = await itemService.getAllItems();
      
      // Return success response
      res.status(200).json({
        success: true,
        message: 'Items retrieved successfully',
        data: items
      });
    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve items';
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  };
  
  /**
   * Get item by ID
   * @route GET /items/:id
   */
  getItemById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Get item by ID
      const item = await itemService.getItemById(id);
      
      // Check if item exists
      if (!item) {
        res.status(404).json({
          success: false,
          message: 'Item not found'
        });
        return;
      }
      
      // Return success response
      res.status(200).json({
        success: true,
        message: 'Item retrieved successfully',
        data: item
      });
    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve item';
      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  };
}

// Export a singleton instance for better performance
export const itemController = new ItemController();
