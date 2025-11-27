import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface ExtractedTask {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  dueDate?: string;
}

export interface TaskExtractionResponse {
  tasks: ExtractedTask[];
  needsClarification?: boolean;
  clarificationQuestion?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiAgentUrl: string;
  private readonly aiAgentModel: string;

  constructor(private configService: ConfigService) {
    this.aiAgentUrl = this.configService.get<string>('agentUrl') || 'http://194.163.150.173:11434/api/generate';
    this.aiAgentModel = this.configService.get<string>('agentModel') || 'qwen2.5:0.5b-instruct';
  }

  async extractTasksFromTranscript(
    transcript: string, 
    conversationHistory?: Array<{role: 'user' | 'ai', content: string}>
  ): Promise<TaskExtractionResponse> {
    try {
      this.logger.log(`Extracting tasks from transcript: ${transcript.substring(0, 100)}...`);
      if (conversationHistory && conversationHistory.length > 0) {
        this.logger.log(`With conversation history: ${conversationHistory.length} messages`);
      }

      const prompt = this.buildTaskExtractionPrompt(transcript, conversationHistory);
      const aiResponse = await this.callAI(prompt);
      
      // Parse AI response and extract tasks
      const result = this.parseAIResponse(aiResponse);

      // Check if AI needs clarification
      if (result.needsClarification && result.clarificationQuestion) {
        this.logger.log('AI requesting clarification');
        return result;
      }

      this.logger.log(`Successfully extracted ${result.tasks.length} tasks`);
      return result;
    } catch (error) {
      this.logger.error('Failed to extract tasks from transcript', error);
      // Fallback: Create a single task if AI fails
      return this.createFallbackTask(transcript);
    }
  }

  private buildTaskExtractionPrompt(
    transcript: string, 
    conversationHistory?: Array<{role: 'user' | 'ai', content: string}>
  ): string {
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = '\n\nPREVIOUS CONVERSATION:\n';
      conversationHistory.forEach(msg => {
        conversationContext += `${msg.role.toUpperCase()}: ${msg.content}\n`;
      });
    }

    return `You are a task extraction assistant. Analyze the following transcript and extract all tasks mentioned.
${conversationContext}
CURRENT TRANSCRIPT:
"${transcript}"

INSTRUCTIONS:
1. Identify all distinct tasks or action items mentioned
2. If the transcript is too vague or doesn't contain clear tasks, ask for clarification
3. For each task, extract:
   - A clear, concise title (max 60 characters)
   - A detailed description
   - Priority level (low, medium, high, or urgent)
   - Relevant tags (e.g., bug, feature, implement, design, api, authentication)
   - Due date if mentioned (ISO format YYYY-MM-DD)

4. Return ONLY valid JSON in ONE of these formats:

IF TASKS ARE CLEAR:
{
  "tasks": [
    {
      "title": "Task title here",
      "description": "Detailed description here",
      "priority": "medium",
      "tags": ["tag1", "tag2"],
      "dueDate": "2025-11-30"
    }
  ]
}

IF CLARIFICATION IS NEEDED:
{
  "needsClarification": true,
  "clarificationQuestion": "Your specific question here",
  "tasks": []
}

RESPONSE (JSON ONLY):`;
  }

  private async callAI(prompt: string): Promise<string> {
    try {
      // Call your Ollama AI endpoint
      const response = await axios.post(
        this.aiAgentUrl,
        {
          model: this.aiAgentModel,
          prompt: prompt,
          stream: false,
          format: 'json', // Request JSON format
          options: {
            temperature: 0.3, // Lower temperature for more consistent output
            top_p: 0.9,
          }
        },
        {
          timeout: 30000, // 30 second timeout
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      return response.data.response || '';
    } catch (error: any) {
      this.logger.error(`AI API call failed: ${error.message}`);
      throw new Error(`Failed to call AI: ${error.message}`);
    }
  }

  private parseAIResponse(aiResponse: string): TaskExtractionResponse {
    try {
      // Remove markdown code blocks if present
      let cleanedResponse = aiResponse.trim();
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      const parsed = JSON.parse(cleanedResponse);
      
      // Check if AI is requesting clarification
      if (parsed.needsClarification && parsed.clarificationQuestion) {
        return {
          tasks: [],
          needsClarification: true,
          clarificationQuestion: parsed.clarificationQuestion
        };
      }
      
      if (parsed.tasks && Array.isArray(parsed.tasks)) {
        return {
          tasks: parsed.tasks.map((task: any) => ({
            title: task.title || 'Untitled Task',
            description: task.description || task.title || '',
            priority: this.validatePriority(task.priority),
            tags: Array.isArray(task.tags) ? task.tags : [],
            dueDate: task.dueDate || undefined,
          }))
        };
      }

      // If AI didn't return proper format, create single task
      throw new Error('Invalid AI response format');
    } catch (error) {
      this.logger.warn(`Failed to parse AI response: ${error.message}`);
      throw error;
    }
  }

  private validatePriority(priority: string): 'low' | 'medium' | 'high' | 'urgent' {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    return validPriorities.includes(priority?.toLowerCase()) 
      ? priority.toLowerCase() as any
      : 'medium';
  }

  private createFallbackTask(transcript: string): TaskExtractionResponse {
    this.logger.log('Creating fallback task due to AI failure');
    
    return {
      tasks: [{
        title: transcript.substring(0, 60) + (transcript.length > 60 ? '...' : ''),
        description: transcript,
        priority: 'medium',
        tags: this.extractBasicTags(transcript),
      }]
    };
  }

  private extractBasicTags(text: string): string[] {
    const lowerText = text.toLowerCase();
    const tags: string[] = [];
    
    const tagMap: { [key: string]: string } = {
      'implement': 'implement',
      'fix': 'fix',
      'bug': 'bug',
      'design': 'design',
      'feature': 'feature',
      'wallet': 'wallet',
      'auth': 'authentication',
      'login': 'authentication',
      'dashboard': 'dashboard',
      'api': 'api',
      'database': 'database',
      'test': 'testing',
      'deploy': 'deployment',
    };
    
    Object.keys(tagMap).forEach(keyword => {
      if (lowerText.includes(keyword)) {
        const tag = tagMap[keyword];
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      }
    });
    
    return tags.length > 0 ? tags : ['general'];
  }
}
