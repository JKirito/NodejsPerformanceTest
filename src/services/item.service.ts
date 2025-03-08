import { DocumentType } from '@typegoose/typegoose';
import { validate } from 'class-validator';
import Item, { ItemModel } from '../models/item.model';
import NodeCache from 'node-cache';

/**
 * Interface for item creation data
 */
export interface CreateItemInput {
  name: string;
  price: number;
  description?: string;
}

/**
 * Item service for handling item-related operations with optimized performance
 */
export class ItemService {
  // In-memory cache for frequently accessed item data
  private itemCache: NodeCache;
  
  constructor() {
    // Initialize cache with TTL of 10 minutes and check period of 1 minute
    this.itemCache = new NodeCache({ 
      stdTTL: 600, 
      checkperiod: 60,
      useClones: false, // Disable cloning for better performance
      maxKeys: 10000    // Limit cache size to prevent memory issues
    });
  }
  
  /**
   * Create a new item with optimized performance
   * @param itemData - The item data for creation
   * @returns The created item document
   * @throws Error if validation fails
   */
  async createItem(itemData: CreateItemInput): Promise<DocumentType<ItemModel>> {
    try {
      // Create a new item instance
      const item = new Item(itemData);
      
      // Validate the item data
      const errors = await validate(item);
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.map(e => Object.values(e.constraints || {}).join(', ')).join(', ')}`);
      }
      
      // Save the item to the database
      await item.save();
      
      // Cache the item for future retrieval
      this.itemCache.set(`item_${item.id}`, item);
      
      return item;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create item');
    }
  }
  
  /**
   * Get all items with optimized performance
   * @returns Array of all items
   */
  async getAllItems(): Promise<DocumentType<ItemModel>[]> {
    try {
      // Check if items are cached
      const cachedItems = this.itemCache.get<DocumentType<ItemModel>[]>('all_items');
      if (cachedItems) {
        return cachedItems;
      }
      
      // If not cached, fetch from database with lean query for better performance
      const items = await Item.find().lean().exec() as DocumentType<ItemModel>[];
      
      // Cache the items for future retrieval
      this.itemCache.set('all_items', items, 300); // Cache for 5 minutes
      
      return items;
    } catch (error) {
      throw new Error('Failed to retrieve items');
    }
  }
  
  /**
   * Get item by ID with optimized performance
   * @param id - The item ID
   * @returns The item document or null if not found
   */
  async getItemById(id: string): Promise<DocumentType<ItemModel> | null> {
    try {
      // Check if item is cached
      const cachedItem = this.itemCache.get<DocumentType<ItemModel>>(`item_${id}`);
      if (cachedItem) {
        return cachedItem;
      }
      
      // If not cached, fetch from database with lean query for better performance
      const item = await Item.findById(id).lean().exec() as DocumentType<ItemModel> | null;
      
      // Cache the item for future retrieval if found
      if (item) {
        this.itemCache.set(`item_${id}`, item);
      }
      
      return item;
    } catch (error) {
      throw new Error('Failed to retrieve item');
    }
  }
  
  /**
   * Invalidate item cache
   * @param id - Optional item ID to invalidate specific item cache
   */
  invalidateCache(id?: string): void {
    if (id) {
      this.itemCache.del(`item_${id}`);
    }
    this.itemCache.del('all_items');
  }
}

// Export a singleton instance for better performance
export const itemService = new ItemService();
