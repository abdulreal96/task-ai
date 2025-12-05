import { Room, RoomEvent, Track, type RemoteAudioTrack } from 'livekit-client';
import { AudioSession } from '@livekit/react-native';
import api from './api';

export interface LiveKitConnectionConfig {
  roomName: string;
  participantName: string;
}

export interface ExtractedTask {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  project?: string;
}

class LiveKitService {
  private room: Room | null = null;
  private onTranscriptCallback: ((text: string) => void) | null = null;
  private onTasksExtractedCallback: ((tasks: ExtractedTask[]) => void) | null = null;
  private onStatusChangeCallback: ((status: string) => void) | null = null;

  /**
   * Connect to a LiveKit room for conversational AI
   */
  async connect(config: LiveKitConnectionConfig): Promise<Room> {
    try {
      // Start audio session for React Native
      await AudioSession.startAudioSession();

      // Get room token from backend
      const response = await api.post('/livekit/room', {
        roomName: config.roomName,
        participantName: config.participantName,
      });

      const { token, wsUrl } = response.data;

      // Create and connect to room
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          simulcast: true,
        },
      });
      
      // Setup event listeners
      this.setupEventListeners();

      // Connect to LiveKit server
      await this.room.connect(wsUrl, token);
      
      // Enable microphone immediately
      await this.room.localParticipant.setMicrophoneEnabled(true);

      this.onStatusChangeCallback?.('Connected - Listening...');
      
      return this.room;
    } catch (error: any) {
      console.error('Failed to connect to LiveKit:', error);
      throw new Error(`Connection failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Setup event listeners for the room
   */
  private setupEventListeners() {
    if (!this.room) return;

    // Listen for remote audio/subscriber updates
    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind !== Track.Kind.Audio) {
        return;
      }

      const audioTrack = track as RemoteAudioTrack;
      audioTrack.setVolume?.(1);

      if (participant.identity.includes('agent')) {
        this.onStatusChangeCallback?.('AI is speaking...');
      }
    });

    this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Audio && participant.identity.includes('agent')) {
        this.onStatusChangeCallback?.('AI stopped speaking');
      }
    });

    this.room.on(RoomEvent.ParticipantConnected, (participant) => {
      if (participant.identity.includes('agent')) {
        this.onStatusChangeCallback?.('AI assistant joined the room');
      }
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      if (participant.identity.includes('agent')) {
        this.onStatusChangeCallback?.('AI assistant left the room');
      }
    });

    // Listen for data messages (task extraction results)
    this.room.on(RoomEvent.DataReceived, (payload, participant) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        
        if (data.type === 'transcript') {
          this.onTranscriptCallback?.(data.text);
        } else if (data.type === 'tasks_extracted') {
          this.onTasksExtractedCallback?.(data.tasks);
          this.onStatusChangeCallback?.('Tasks extracted - please confirm');
        }
      } catch (error) {
        console.error('Failed to parse data message:', error);
      }
    });

    // Handle disconnection
    this.room.on(RoomEvent.Disconnected, () => {
      this.onStatusChangeCallback?.('Disconnected');
      this.cleanup();
    });

    // Handle connection state changes
    this.room.on(RoomEvent.Connected, () => {
      this.onStatusChangeCallback?.('Ready - start speaking');
    });
  }

  /**
   * Register callback for transcript updates
   */
  onTranscript(callback: (text: string) => void) {
    this.onTranscriptCallback = callback;
  }

  /**
   * Register callback for extracted tasks
   */
  onTasksExtracted(callback: (tasks: ExtractedTask[]) => void) {
    this.onTasksExtractedCallback = callback;
  }

  /**
   * Register callback for status changes
   */
  onStatusChange(callback: (status: string) => void) {
    this.onStatusChangeCallback = callback;
  }

  /**
   * Send a message to confirm task creation
   */
  async confirmTasks(confirm: boolean) {
    if (!this.room) {
      throw new Error('Not connected to room');
    }

    const message = JSON.stringify({
      type: 'confirm_tasks',
      confirmed: confirm,
    });

    const encoder = new TextEncoder();
    await this.room.localParticipant.publishData(encoder.encode(message), { reliable: true });
  }

  /**
   * Disconnect from the room
   */
  async disconnect() {
    if (this.room) {
      await this.room.disconnect();
      await AudioSession.stopAudioSession();
      this.cleanup();
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup() {
    this.room = null;
    this.onTranscriptCallback = null;
    this.onTasksExtractedCallback = null;
    this.onStatusChangeCallback = null;
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.room !== null && this.room.state === 'connected';
  }
}

export default new LiveKitService();
