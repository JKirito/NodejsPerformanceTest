import { prop, getModelForClass, pre, DocumentType } from '@typegoose/typegoose';
import * as argon2 from 'argon2';
import { IsEmail, MinLength } from 'class-validator';

// Optimize argon2 parameters for better performance while maintaining security
// These parameters are tuned for better performance in high-load scenarios
const ARGON2_OPTIONS = {
  type: argon2.argon2id,    // Balanced algorithm (security vs. speed)
  memoryCost: 4096,        // Reduced from default 65536 for better performance
  timeCost: 3,             // Reduced from default 3
  parallelism: 2,          // Increased for better use of multiple cores
  hashLength: 32           // Standard hash length
};

/**
 * User model class using Typegoose
 * @pre save - Hashes the password before saving
 */
@pre<UserModel>('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a hashed password using argon2 with optimized parameters
    this.password = await argon2.hash(this.password, ARGON2_OPTIONS);
    return next();
  } catch (error) {
    return next(error as Error);
  }
})
export class UserModel {
  @prop({ required: true,type: String })
  firstName!: string;
  
  @prop({ required: true ,type: String })
  lastName!: string;
  
  @prop({ required: true, unique: true ,type: String })
  @IsEmail()
  email!: string;
  
  @prop({ required: true ,type: String })
  @MinLength(8)
  password!: string;
  
  @prop({ default: false ,type: Boolean })
  isVerified!: boolean;
  
  @prop({ default: Date.now ,type: Date })
  createdAt!: Date;
  
  @prop({ default: Date.now ,type: Date })
  updatedAt!: Date;
  
  /**
   * Compare a candidate password with the user's password
   * @param candidatePassword - The password to check
   * @returns True if the passwords match, false otherwise
   */
  async comparePassword(this: DocumentType<UserModel>, candidatePassword: string): Promise<boolean> {
    try {
      // Use optimized verification settings
      return await argon2.verify(this.password, candidatePassword);
    } catch (error) {
      throw new Error(`Password comparison error: ${error}`);
    }
  }
  
  /**
   * Get the full name of the user
   * @returns The full name (firstName + lastName)
   */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

// Create and export the Mongoose model
const User = getModelForClass(UserModel);
export default User;
