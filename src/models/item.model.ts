import { prop, getModelForClass, DocumentType } from '@typegoose/typegoose';
import { IsNotEmpty, Min } from 'class-validator';

/**
 * Item model class using Typegoose
 * Represents a simple item with name and price
 */
export class ItemModel {
  @prop({ required: true, type: String })
  @IsNotEmpty({ message: 'Item name is required' })
  name!: string;
  
  @prop({ required: true, type: Number })
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  price!: number;
  
  @prop({ default: Date.now, type: Date })
  createdAt!: Date;
  
  @prop({ type: String })
  description?: string;
  
  /**
   * Calculates the price with tax
   * @param taxRate - The tax rate as a decimal (e.g., 0.1 for 10%)
   * @returns The price including tax
   */
  getPriceWithTax(taxRate: number = 0.1): number {
    return this.price * (1 + taxRate);
  }
}

// Create and export the Mongoose model
const Item = getModelForClass(ItemModel);
export default Item;
