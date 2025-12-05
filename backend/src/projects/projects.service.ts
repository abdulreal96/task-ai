import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(userId: string, createProjectDto: CreateProjectDto): Promise<ProjectDocument> {
    const project = new this.projectModel({
      ...createProjectDto,
      userId: new Types.ObjectId(userId),
    });
    return project.save();
  }

  async findAll(userId: string): Promise<ProjectDocument[]> {
    return this.projectModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  async findOne(userId: string, projectId: string): Promise<ProjectDocument | null> {
    return this.projectModel.findOne({ 
      _id: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(userId)
    }).exec();
  }

  async findOrCreate(userId: string, projectName: string): Promise<ProjectDocument> {
    // Try to find existing project by name
    const existingProject = await this.projectModel.findOne({
      userId: new Types.ObjectId(userId),
      name: projectName,
    }).exec();

    // Create if doesn't exist
    if (!existingProject) {
      return await this.create(userId, { name: projectName });
    }

    return existingProject;
  }

  async delete(userId: string, projectId: string): Promise<void> {
    await this.projectModel.deleteOne({
      _id: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(userId)
    }).exec();
  }
}
