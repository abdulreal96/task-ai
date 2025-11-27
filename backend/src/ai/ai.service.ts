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
  message?: string;
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
      const cleanedTranscript = this.sanitizeTranscript(transcript);
      const normalizedHistory = this.normalizeConversationHistory(conversationHistory);

      this.logger.log(`Extracting tasks from transcript: ${cleanedTranscript.substring(0, 100)}...`);
      if (normalizedHistory && normalizedHistory.length > 0) {
        this.logger.log(`With conversation history: ${normalizedHistory.length} messages`);
      }

      const prompt = this.buildTaskExtractionPrompt(cleanedTranscript, normalizedHistory);
      const aiResponse = await this.callAI(prompt);
      
      // Parse AI response and extract tasks
      const result = this.parseAIResponse(aiResponse);

      const filteredResult = this.filterIrrelevantTasks(cleanedTranscript, result);

      // Check if AI needs clarification
      if (filteredResult.needsClarification && filteredResult.clarificationQuestion) {
        this.logger.log('AI requesting clarification');
        return filteredResult;
      }

      this.logger.log(`Successfully extracted ${filteredResult.tasks.length} tasks after filtering`);
      return filteredResult;
    } catch (error) {
      this.logger.error('Failed to extract tasks from transcript', error);
      // Fallback: Create a single task if AI fails
      return this.createFallbackTask(this.sanitizeTranscript(transcript));
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
1. Identify all distinct software engineering tasks or action items that require coding, testing, deployment, or design work.
2. If the transcript is too vague or doesn't contain clear engineering tasks, ask for clarification.
3. If the transcript is NOT about software development work (e.g., it's a greeting, personal reminder, or unrelated request), respond with ZERO tasks and provide a short explanation of why no work was created.
4. For each task, extract:
   - A clear, concise title (max 60 characters)
   - A detailed description
   - Priority level (low, medium, high, or urgent)
   - Relevant tags (e.g., bug, feature, implement, design, api, authentication)
   - Due date if mentioned (ISO format YYYY-MM-DD)
5. Keep the original product or domain wording (e.g., "User Service", "Driver Service", "trip", "wallet") that appears in the transcript. Correct obvious speech-to-text mistakes, but never invent features that were not mentioned.
6. The description must restate the key nouns and expectations from the transcript (no boilerplate text like "Need a detailed description...").

7. Return ONLY valid JSON in ONE of these formats:

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

IF THERE ARE NO SOFTWARE TASKS:
{
  "tasks": [],
  "message": "Explain briefly why no tasks were generated"
}

REFERENCE EXAMPLE:
Transcript: "On user service I need to create and cancel trips. On driver service I should be able to accept or cancel trips."
Response:
{
  "tasks": [
    {
      "title": "User Service: create/cancel trips",
      "description": "Implement endpoints that let riders create a trip request and cancel it before it is accepted.",
      "priority": "high",
      "tags": ["api", "user-service", "trip"],
      "dueDate": null
    },
    {
      "title": "Driver Service: accept/cancel trips",
      "description": "Update the driver workflow so drivers can accept assigned trips and cancel them when necessary with a reason.",
      "priority": "high",
      "tags": ["driver-service", "workflow"],
      "dueDate": null
    }
  ]
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
          })),
          message: parsed.message || parsed.reason,
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

  private filterIrrelevantTasks(transcript: string, result: TaskExtractionResponse): TaskExtractionResponse {
    if (result.needsClarification) {
      return result;
    }

    const tasks = result.tasks || [];
    const relevantTasks = tasks.filter((task) => this.isTaskRelevant(task));
    const transcriptHasContext = this.containsEngineeringKeywords(transcript) || this.hasActionableLanguage(transcript);

    if (relevantTasks.length === 0 && !transcriptHasContext) {
      return {
        ...result,
        tasks: [],
        message: result.message || 'No actionable software tasks detected. Please describe a bug, feature, or engineering change.',
      };
    }

    if (relevantTasks.length === 0) {
      return {
        ...result,
        tasks,
      };
    }

    return {
      ...result,
      tasks: relevantTasks,
    };
  }

  private containsEngineeringKeywords(text: string): boolean {
    const normalized = text.toLowerCase();
    const keywords = [
      'bug', 'deploy', 'api', 'endpoint', 'feature', 'issue', 'ticket', 'code', 'refactor',
      'frontend', 'backend', 'database', 'query', 'ui', 'ux', 'android', 'ios', 'expo',
      'react', 'nest', 'server', 'integration', 'authentication', 'login', 'task', 'sprint',
      'release', 'test', 'coverage', 'unit test', 'service', 'trip', 'driver', 'wallet',
      'payment', 'booking', 'dispatch', 'microservice', 'workflow'
    ];
    return keywords.some((keyword) => normalized.includes(keyword));
  }

  private hasActionableLanguage(text: string): boolean {
    const normalized = text.toLowerCase();
    const actionVerbs = ['create', 'add', 'update', 'cancel', 'accept', 'implement', 'build', 'enable', 'support', 'optimize', 'schedule', 'assign'];
    const domainNouns = ['service', 'trip', 'driver', 'rider', 'wallet', 'payment', 'transaction', 'report', 'notification', 'workflow'];
    const hasVerb = actionVerbs.some((verb) => normalized.includes(`${verb} `));
    const hasDomainWord = domainNouns.some((noun) => normalized.includes(noun));
    return hasVerb && hasDomainWord;
  }

  private isTaskRelevant(task: ExtractedTask): boolean {
    const text = `${task.title ?? ''} ${task.description ?? ''} ${(task.tags || []).join(' ')}`.toLowerCase();
    if (!text.trim()) {
      return false;
    }

    const keywords = [
      'bug', 'fix', 'implement', 'build', 'document', 'deploy', 'api', 'ui', 'ux', 'android',
      'ios', 'feature', 'tests', 'refactor', 'optimize', 'auth', 'database', 'server', 'component',
      'design', 'integration'
    ];

    return keywords.some((keyword) => text.includes(keyword));
  }

  private sanitizeTranscript(text: string): string {
    if (!text) {
      return '';
    }

    const replacements: Array<{ pattern: RegExp; replacement: string }> = [
      { pattern: /\bon reverse\b/gi, replacement: 'on driver service' },
      { pattern: /\breverse\b/gi, replacement: 'driver service' },
      { pattern: /\bwider(?=\s+(transaction|wallet))/gi, replacement: 'user' },
      { pattern: /\bE3\b/gi, replacement: 'it' },
    ];

    let cleaned = text;
    replacements.forEach(({ pattern, replacement }) => {
      cleaned = cleaned.replace(pattern, replacement);
    });

    return cleaned.replace(/\s+/g, ' ').trim();
  }

  private normalizeConversationHistory(
    history?: Array<{ role: 'user' | 'ai'; content: string }>
  ): Array<{ role: 'user' | 'ai'; content: string }> | undefined {
    if (!history || history.length === 0) {
      return history;
    }

    return history.map((message) => {
      if (message.role === 'user') {
        return {
          ...message,
          content: this.sanitizeTranscript(message.content),
        };
      }
      return message;
    });
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
      'trip': 'trip',
      'driver': 'driver',
      'service': 'service',
      'payment': 'payment',
      'transaction': 'transaction',
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
