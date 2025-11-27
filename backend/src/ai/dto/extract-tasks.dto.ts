import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ConversationMessageDto {
  @IsIn(['user', 'ai'])
  role: 'user' | 'ai';

  @IsString()
  content: string;
}

export class ExtractTasksDto {
  @IsString()
  transcript: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversationMessageDto)
  conversationHistory?: ConversationMessageDto[];
}
