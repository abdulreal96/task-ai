import { IsOptional, IsString, IsEnum, IsDateString, IsArray } from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['todo', 'in-progress', 'completed'])
  status?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  timeSpent?: number;

  @IsOptional()
  @IsEnum(['stopped', 'running', 'paused'])
  timerStatus?: string;

  @IsOptional()
  @IsDateString()
  timerStartedAt?: string;

  @IsOptional()
  @IsArray()
  activities?: any[];
}
