import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TimerSessionDocument = TimerSession & Document;

export interface TimerPause {
  pausedAt: Date;
  resumedAt?: Date;
}

@Schema({ timestamps: true })
export class TimerSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  taskId: Types.ObjectId;

  @Prop({ required: true })
  startTime: Date;

  @Prop()
  endTime?: Date;

  @Prop({ type: [Object], default: [] })
  pauses: TimerPause[];

  @Prop({ default: 0 })
  totalDuration: number; // in seconds

  @Prop({ type: String, enum: ['active', 'paused', 'completed'], default: 'active' })
  status: string;
}

export const TimerSessionSchema = SchemaFactory.createForClass(TimerSession);

// Indexes
TimerSessionSchema.index({ userId: 1, taskId: 1, status: 1 });
TimerSessionSchema.index({ userId: 1, startTime: -1 });
