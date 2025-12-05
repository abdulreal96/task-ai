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

export interface TranscriptMessage {
  speaker: 'user' | 'agent';
  text: string;
  isFinal?: boolean;
  timestamp: number;
}

class LiveKitService {
  private room: Room | null = null;
  private onTranscriptCallback: ((message: TranscriptMessage) => void) | null = null;
  private onTasksExtractedCallback: ((tasks: ExtractedTask[]) => void) | null = null;
  private onStatusChangeCallback: ((status: string) => void) | null = null;

  async connect(config: LiveKitConnectionConfig): Promise<Room> {
    try {
      await AudioSession.startAudioSession();

      const response = await api.post('/livekit/room', {
        roomName: config.roomName,
        participantName: config.participantName,
      });

      const { token, wsUrl } = response.data;

      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          simulcast: true,
        },
      });
      
      this.setupEventListeners();
      await this.room.connect(wsUrl, token);
      await this.room.localParticipant.setMicrophoneEnabled(true);

      this.onStatusChangeCallback?.('Connected - Listening...');
      
      return this.room;
    } catch (error: any) {
      console.error('Failed to connect to LiveKit:', error);
      throw new Error(`Connection failed: ${error.message || 'Unknown error'}`);
    }
  }

  private setupEventListeners() {
    if (!this.room) return;

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

    this.room.on(RoomEvent.DataReceived, (payload, participant) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        
        if (data.type === 'transcript') {
          const message: TranscriptMessage = {
            speaker: data.speaker === 'agent' ? 'agent' : 'user',
            text: data.text,
            isFinal: data.isFinal,
            timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
          };
          this.onTranscriptCallback?.(message);
        } else if (data.type === 'tasks_extracted') {
          this.onTasksExtractedCallback?.(data.tasks);
          this.onStatusChangeCallback?.('Tasks extracted - please confirm');
        }
      } catch (error) {
        console.error('Failed to parse data message:', error);
      }
    });

    this.room.on(RoomEvent.Disconnected, () => {
      this.onStatusChangeCallback?.('Disconnected');
      this.cleanup();
    });

    this.room.on(RoomEvent.Connected, () => {
      this.onStatusChangeCallback?.('Ready - start speaking');
    });
  }

  onTranscript(callback: ((message: TranscriptMessage) => void) | null) {
    this.onTranscriptCallback = callback;
  }

  onTasksExtracted(callback: (tasks: ExtractedTask[]) => void) {
    this.onTasksExtractedCallback = callback;
  }

  onStatusChange(callback: (status: string) => void) {
    this.onStatusChangeCallback = callback;
  }

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

  async disconnect() {
    if (this.room) {
      await this.room.disconnect();
      await AudioSession.stopAudioSession();
      this.cleanup();
    }
  }

  private cleanup() {
    this.room = null;
    this.onTranscriptCallback = null;
    this.onTasksExtractedCallback = null;
    this.onStatusChangeCallback = null;
  }

  isConnected(): boolean {
    return this.room !== null && this.room.state === 'connected';
  }
}

export default new LiveKitService();
