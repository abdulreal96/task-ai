import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

export interface Activity {
  type: 'created' | 'updated' | 'status_changed' | 'timer_started' | 'timer_stopped';
  timestamp: Date;
  description: string;
}

@Schema({ timestamps: true })
export class Task {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: String, enum: ['todo', 'in-progress', 'completed'], default: 'todo' })
  status: string;

  @Prop({ type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' })
  priority: string;

  @Prop()
  dueDate?: Date;

  @Prop({ default: 0 })
  timeSpent: number; // in seconds

  @Prop({ type: String, enum: ['stopped', 'running', 'paused'], default: 'stopped' })
  timerStatus: string;

  @Prop()
  timerStartedAt?: Date;

  @Prop({ type: [Object], default: [] })
  activities: Activity[];

  @Prop()
  voiceTranscription?: string;

  @Prop({ default: false })
  aiGenerated: boolean;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

// Indexes for better query performance
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, dueDate: 1 });
