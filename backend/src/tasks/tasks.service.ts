import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from '../schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
  ) {}

  async create(userId: string, createTaskDto: CreateTaskDto): Promise<TaskDocument> {
    const task = new this.taskModel({
      ...createTaskDto,
      userId,
      activities: [{
        type: 'created',
        timestamp: new Date(),
        description: 'Task created',
      }],
    });
    return task.save();
  }

  async findAll(userId: string, status?: string): Promise<TaskDocument[]> {
    const filter: any = { userId };
    if (status) {
      filter.status = status;
    }
    return this.taskModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(userId: string, taskId: string): Promise<TaskDocument> {
    const task = await this.taskModel.findOne({ _id: taskId, userId }).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(userId: string, taskId: string, updateTaskDto: UpdateTaskDto): Promise<TaskDocument> {
    const task = await this.findOne(userId, taskId);
    
    // Store the activities array if provided, or keep existing
    const providedActivities = updateTaskDto.activities;
    
    // Handle timer start
    if (updateTaskDto.timerStatus === 'running' && task.timerStatus !== 'running') {
      task.timerStartedAt = new Date();
      task.timerStatus = 'running';
      task.activities.push({
        type: 'timer_started',
        timestamp: new Date(),
        description: 'Timer started',
      });
    }
    
    // Handle timer stop
    if (updateTaskDto.timerStatus === 'paused' && task.timerStatus === 'running') {
      if (task.timerStartedAt) {
        const elapsed = Math.floor((new Date().getTime() - new Date(task.timerStartedAt).getTime()) / 1000);
        task.timeSpent = (task.timeSpent || 0) + elapsed;
        task.activities.push({
          type: 'timer_stopped',
          timestamp: new Date(),
          description: `Timer stopped (Duration: ${Math.floor(elapsed / 60)}m ${elapsed % 60}s)`,
        });
      }
      task.timerStatus = 'paused';
      task.timerStartedAt = undefined;
    }
    
    // Track status changes
    if (updateTaskDto.status && updateTaskDto.status !== task.status) {
      task.activities.push({
        type: 'status_changed',
        timestamp: new Date(),
        description: `Status changed from ${task.status} to ${updateTaskDto.status}`,
      });
    }

    // Update fields (excluding activities and timer fields we already handled) - only update defined fields
    const { activities, timerStatus, timerStartedAt, ...otherUpdates } = updateTaskDto;
    Object.keys(otherUpdates).forEach(key => {
      if (otherUpdates[key] !== undefined) {
        task[key] = otherUpdates[key];
      }
    });
    
    // If activities were explicitly provided, use them; otherwise keep the modified array
    if (providedActivities) {
      task.activities = providedActivities;
    } else if (!updateTaskDto.status && !updateTaskDto.timerStatus) {
      // Only add 'updated' activity if we're not tracking a status or timer change
      task.activities.push({
        type: 'updated',
        timestamp: new Date(),
        description: 'Task updated',
      });
    }

    return task.save();
  }

  async remove(userId: string, taskId: string): Promise<void> {
    const result = await this.taskModel.deleteOne({ _id: taskId, userId }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Task not found');
    }
  }

  async getStats(userId: string): Promise<any> {
    const tasks = await this.taskModel.find({ userId }).exec();
    
    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
    };
  }
}
