import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TagDocument = Tag & Document;

@Schema({ timestamps: true })
export class Tag {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  color?: string;

  @Prop({ default: 0 })
  usageCount: number;
}

export const TagSchema = SchemaFactory.createForClass(Tag);

// Ensure unique tag names per user
TagSchema.index({ userId: 1, name: 1 }, { unique: true });
