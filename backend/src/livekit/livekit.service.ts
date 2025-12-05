import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AccessToken,
  AgentDispatchClient,
  Room,
  RoomServiceClient,
} from 'livekit-server-sdk';

interface CreateRoomOptions {
  emptyTimeout?: number;
  maxParticipants?: number;
}

@Injectable()
export class LivekitService {
  private readonly logger = new Logger(LivekitService.name);
  private roomService: RoomServiceClient;
  private dispatchClient?: AgentDispatchClient;
  private apiKey: string;
  private apiSecret: string;
  private wsUrl: string;
  private agentName: string;

  private restUrl?: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('LIVEKIT_API_KEY') || '';
    this.apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET') || '';
    this.wsUrl = this.configService.get<string>('LIVEKIT_WS_URL') || '';
    this.restUrl =
      this.configService.get<string>('LIVEKIT_HTTP_URL') || this.deriveHttpUrl(this.wsUrl);
    this.agentName = this.configService.get<string>('LIVEKIT_AGENT_NAME') || 'task-ai-agent';

    if (!this.apiKey || !this.apiSecret || !this.wsUrl) {
      this.logger.warn('LiveKit credentials not configured. Service will not function properly.');
    } else {
      this.roomService = new RoomServiceClient(this.wsUrl, this.apiKey, this.apiSecret);
      this.logger.log('LiveKit service initialized successfully');
    }

    if (this.restUrl) {
      try {
        this.dispatchClient = new AgentDispatchClient(this.restUrl, this.apiKey, this.apiSecret);
        this.logger.log('LiveKit agent dispatch client initialized');
      } catch (error) {
        this.logger.warn(`Failed to initialize dispatch client: ${error instanceof Error ? error.message : error}`);
      }
    } else {
      this.logger.warn('No LiveKit HTTP URL provided. Agents will not be auto-dispatched.');
    }
  }

  /**
   * Create a new LiveKit room for conversation
   */
  async createRoom(roomName: string, options?: CreateRoomOptions): Promise<Room> {
    try {
      const room = await this.roomService.createRoom({
        name: roomName,
        emptyTimeout: 300, // 5 minutes
        maxParticipants: 2, // User + AI agent
        ...options,
      });

      this.logger.log(`Room created: ${roomName}`);
      return room;
    } catch (error) {
      this.logger.error(`Failed to create room: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate access token for participant to join room
   */
  async generateToken(
    roomName: string,
    participantName: string,
    metadata?: string,
  ): Promise<string> {
    try {
      const token = new AccessToken(this.apiKey, this.apiSecret, {
        identity: participantName,
        name: participantName,
        metadata,
      });

      token.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      const jwt = await token.toJwt();
      this.logger.log(`Token generated for ${participantName} in room ${roomName}`);
      return jwt;
    } catch (error) {
      this.logger.error(`Failed to generate token: ${error.message}`);
      throw error;
    }
  }

  /**
   * List active rooms
   */
  async listRooms(): Promise<Room[]> {
    try {
      const rooms = await this.roomService.listRooms();
      return rooms;
    } catch (error) {
      this.logger.error(`Failed to list rooms: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a room
   */
  async deleteRoom(roomName: string): Promise<void> {
    try {
      await this.roomService.deleteRoom(roomName);
      this.logger.log(`Room deleted: ${roomName}`);
    } catch (error) {
      this.logger.error(`Failed to delete room: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get room details
   */
  async getRoom(roomName: string): Promise<Room> {
    try {
      const rooms = await this.roomService.listRooms([roomName]);
      return rooms[0];
    } catch (error) {
      this.logger.error(`Failed to get room: ${error.message}`);
      throw error;
    }
  }

  async dispatchAgent(roomName: string, metadata?: string): Promise<void> {
    if (!this.dispatchClient) {
      this.logger.warn('Dispatch client not configured. Skipping agent dispatch.');
      return;
    }

    try {
      await this.dispatchClient.createDispatch(roomName, this.agentName, metadata ? { metadata } : undefined);
      this.logger.log(`Agent dispatched to room ${roomName}`);
    } catch (error) {
      this.logger.error(
        `Failed to dispatch agent: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private deriveHttpUrl(wsUrl?: string): string | undefined {
    if (!wsUrl) {
      return undefined;
    }

    try {
      const url = new URL(wsUrl);
      if (url.protocol === 'wss:') {
        url.protocol = 'https:';
      } else if (url.protocol === 'ws:') {
        url.protocol = 'http:';
      }
      url.pathname = '';
      url.search = '';
      url.hash = '';
      return url.toString();
    } catch (error) {
      this.logger.warn(
        `Unable to derive LiveKit HTTP URL from ${wsUrl}: ${error instanceof Error ? error.message : error}`,
      );
      return undefined;
    }
  }
}
