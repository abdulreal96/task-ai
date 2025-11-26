import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  emailVerificationOTP?: string;

  @Prop()
  emailVerificationOTPExpires?: Date;

  @Prop({ default: 'blue' })
  colorScheme: string;

  @Prop({ default: false })
  darkMode: boolean;

  @Prop({ type: Object, default: {} })
  preferences: {
    notifications?: boolean;
    defaultTaskPriority?: string;
    voiceLanguage?: string;
  };

  @Prop()
  refreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
