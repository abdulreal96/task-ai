import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LivekitService } from './livekit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateRoomDto } from './dto/create-room.dto';

@Controller('livekit')
@UseGuards(JwtAuthGuard)
export class LivekitController {
  constructor(private readonly livekitService: LivekitService) {}

  /**
   * Create a new conversation room and get access token
   */
  @Post('room')
  async createRoom(@Body() createRoomDto: CreateRoomDto, @Request() req) {
    const userId = req.user.userId;
    const roomName = createRoomDto.roomName || `task-conversation-${userId}-${Date.now()}`;
    const participantName = createRoomDto.participantName || `user-${userId}`;
    const authHeader: string | undefined = req.headers?.authorization;
    const authToken = authHeader?.replace(/Bearer\s+/i, '').trim();
    const metadataPayload: Record<string, string> = { userId };
    if (authToken) {
      metadataPayload.authToken = authToken;
    }
    const participantMetadata = JSON.stringify(metadataPayload);

    // Create room
    const room = await this.livekitService.createRoom(roomName);

    // Generate token for user
    const token = await this.livekitService.generateToken(
      roomName,
      participantName,
      participantMetadata,
    );

    // Dispatch AI agent into the room (best-effort)
    await this.livekitService.dispatchAgent(room.name, participantMetadata);

    return {
      roomName: room.name,
      token,
      wsUrl: process.env.LIVEKIT_WS_URL,
    };
  }

  /**
   * Get list of active rooms
   */
  @Get('rooms')
  async listRooms() {
    return await this.livekitService.listRooms();
  }

  /**
   * Delete a room
   */
  @Delete('room/:roomName')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRoom(@Param('roomName') roomName: string) {
    await this.livekitService.deleteRoom(roomName);
  }

  /**
   * Get room details
   */
  @Get('room/:roomName')
  async getRoom(@Param('roomName') roomName: string) {
    return await this.livekitService.getRoom(roomName);
  }
}
