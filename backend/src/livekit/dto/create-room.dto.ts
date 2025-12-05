import { IsString, IsOptional } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  roomName: string;

  @IsOptional()
  @IsString()
  participantName?: string;
}
