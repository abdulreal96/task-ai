import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService, ExtractedTask } from './ai.service';
import { ExtractTasksDto } from './dto/extract-tasks.dto';

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
    needsClarification?: boolean;
    clarificationQuestion?: string;
    error?: string;
  }> {
    const { transcript, conversationHistory } = extractTasksDto;
    
    if (!transcript || transcript.trim().length === 0) {
      return {
        success: false,
        message: 'Transcript is required',
        tasks: []
      };
    }

    try {
      const result = await this.aiService.extractTasksFromTranscript(transcript, conversationHistory);
      
      // If AI needs clarification
      if (result.needsClarification && result.clarificationQuestion) {
        return {
          success: true,
          message: 'AI needs more information',
          tasks: [],
          needsClarification: true,
          clarificationQuestion: result.clarificationQuestion
        };
      }

      return {
        success: true,
        message: result.message || `Successfully extracted ${result.tasks.length} task(s)`,
        tasks: result.tasks,
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
