import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService, ExtractedTask } from './ai.service';

class ExtractTasksDto {
  transcript: string;
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('extract-tasks')
  @HttpCode(HttpStatus.OK)
  async extractTasks(@Body() extractTasksDto: ExtractTasksDto, @Request() req): Promise<{
    success: boolean;
    message: string;
    tasks: ExtractedTask[];
    error?: string;
  }> {
    const { transcript } = extractTasksDto;
    
    if (!transcript || transcript.trim().length === 0) {
      return {
        success: false,
        message: 'Transcript is required',
        tasks: []
      };
    }

    try {
      const result = await this.aiService.extractTasksFromTranscript(transcript);
      
      return {
        success: true,
        message: `Successfully extracted ${result.tasks.length} task(s)`,
        tasks: result.tasks
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to extract tasks',
        error: error.message,
        tasks: []
      };
    }
  }
}
