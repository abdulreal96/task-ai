import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  color?: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// Indexes for better query performance
ProjectSchema.index({ userId: 1 });
ProjectSchema.index({ userId: 1, name: 1 }, { unique: true });
