import { Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { cli, defineAgent, llm, type JobContext, voice, runWithJobContext, WorkerOptions } from '@livekit/agents';
import { RoomEvent } from '@livekit/rtc-node';
import { z } from 'zod';
import { createRequire } from 'node:module';
import * as path from 'node:path';
import { config } from 'dotenv';

// Load environment variables from .env or .env.local
config({ path: path.resolve(__dirname, '../../.env.local') });
config({ path: path.resolve(__dirname, '../../.env') });

const { Agent, AgentSession, AgentSessionEventTypes } = voice;
const { tool, ToolError } = llm;
type ToolOptions<UserData = unknown> = llm.ToolOptions<UserData>;

const nodeRequire = createRequire(__filename);
let loggerInitialized = false;

const logger = new Logger('LiveKitAgent');

function ensureLivekitLogger(): void {
  if (loggerInitialized) {
    return;
  }

  try {
    const entryPath = nodeRequire.resolve('@livekit/agents');
    const logModulePath = path.join(path.dirname(entryPath), 'log.cjs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initializeLogger } = nodeRequire(logModulePath);
    initializeLogger({
      pretty: (process.env.NODE_ENV ?? 'development') !== 'production',
      level: process.env.LIVEKIT_AGENT_LOG_LEVEL ?? 'info',
    });
    loggerInitialized = true;
  } catch (error) {
    logger.warn(`Unable to initialize LiveKit logger: ${formatError(error)}`);
  }
}

type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type TaskStatus = 'todo' | 'in-progress' | 'completed';

const taskSchema = z.object({
  title: z.string().min(3, 'A descriptive title is required'),
  description: z.string().min(5, 'Provide a short description of the task'),
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'])
    .default('medium')
    .describe('Default to medium when user is unsure'),
  dueDate: z
    .string()
    .optional()
    .describe('ISO 8601 date (YYYY-MM-DD). Convert natural language before sending'),
  tags: z.array(z.string()).optional(),
  status: z
    .enum(['todo', 'in-progress', 'completed'])
    .default('todo')
    .describe('Default to todo unless explicitly stated'),
  projectName: z.string().optional(),
});

type TaskDraft = z.infer<typeof taskSchema>;

interface AgentUserData {
  userId: string;
  authToken?: string;
  apiBaseUrl: string;
  pendingTasks: TaskDraft[];
}

const DEFAULT_LLM_MODEL = process.env.LIVEKIT_LLM_MODEL ?? 'openai/gpt-4o-mini';
const DEFAULT_STT_MODEL = process.env.LIVEKIT_STT_MODEL ?? 'deepgram/nova-2-general:en';
const DEFAULT_TTS_MODEL = process.env.LIVEKIT_TTS_MODEL ?? 'cartesia/sonic';

const systemPrompt = `You are TaskMate, a friendly AI that helps busy professionals capture tasks accurately.

Workflow:
1. Listen for the user to describe what they need to do. Let them speak naturally.
2. Extract every actionable task mentioned. For each one capture:
   • Title (concise, action-oriented)
   • Description (one sentence summary)
   • Priority (low | medium | high | urgent). Default to medium when unstated.
   • Due date when provided. Convert phrases such as "tomorrow" into YYYY-MM-DD.
   • Tags and project names only when the user provides them.
   • Status defaults to todo unless the user says it is already in progress or finished.
3. When you think you have enough information call confirm_task_details with an array of tasks. This also sends the list to the mobile app UI, so read the summary naturally and then ask for confirmation.
4. Wait for explicit confirmation ("yes", "looks good", or the UI confirm button which sends you a text message). Only after a clear confirmation call create_task for each task.
5. After saving, acknowledge success and ask if the user wants to capture more work.

Guidelines:
- Be conversational, short, and confident.
- Rephrase unclear details instead of asking many rapid-fire questions.
- Never create a task unless it was confirmed in step 4.
- If the user rejects your summary, adjust the tasks and reconfirm before saving.`;

// Initialize logger at module load time
ensureLivekitLogger();

const agent = defineAgent({
  entry: async (ctx: JobContext) => {
    logger.log(`Starting agent for room ${ctx.job.room?.name ?? 'unknown'}`);

    await ctx.connect();

    const session = new AgentSession<AgentUserData>({
      stt: DEFAULT_STT_MODEL,
      llm: DEFAULT_LLM_MODEL,
      tts: DEFAULT_TTS_MODEL,
      turnDetection: 'stt',
      voiceOptions: {
        allowInterruptions: true,
        maxToolSteps: 4,
      },
      userData: {
        userId: 'pending-user',
        apiBaseUrl: getApiBaseUrl(),
        pendingTasks: [],
      },
    });

    const tools = buildTooling(ctx.room);
    const agent = new Agent<AgentUserData>({
      instructions: systemPrompt,
      tools,
    });

    registerTranscriptBridge(ctx.room, session);
    registerConfirmationBridge(ctx.room, session);

    await runWithJobContext(ctx, async () => {
      await session.start({
        agent,
        room: ctx.room,
        record: false,
      });
    });

    ctx.addShutdownCallback(async () => {
      await session.close();
    });

    try {
      const participant = await ctx.waitForParticipant();
      applyParticipantMetadata(session, participant);
      logger.log(`Agent ready for user ${session.userData.userId}`);
    } catch (error) {
      logger.error(`Failed to bind participant metadata: ${formatError(error)}`);
    }
  },
});

export default agent;

// Hack for CJS/ESM interop when loaded via import() in the worker process
// The LiveKit SDK uses dynamic import() which expects module.exports to be the default export for CJS modules
if (typeof module !== 'undefined' && module.exports) {
  (module as any).exports = agent;
}


function buildTooling(room: unknown) {
  return {
    confirm_task_details: tool({
      description:
        'Show the extracted tasks to the user before saving them. Use this to restate everything that will be created.',
      parameters: z.object({
        tasks: z.array(taskSchema).min(1),
        summary: z
          .string()
          .optional()
          .describe('Short natural language recap you will read back to the user'),
      }),
      execute: async ({ tasks, summary }, opts: ToolOptions<AgentUserData>) => {
        opts.ctx.userData.pendingTasks = tasks;
        await publishData(room, {
          type: 'tasks_extracted',
          tasks,
          summary,
        });
        return {
          acknowledged: true,
          taskCount: tasks.length,
        };
      },
    }),
    create_task: tool({
      description:
        'Persist a confirmed task to the Task AI backend. Only call this after the user explicitly agrees.',
      parameters: taskSchema,
      execute: async (payload, opts: ToolOptions<AgentUserData>) => {
        const userData = opts.ctx.userData;
        if (!userData.authToken) {
          throw new ToolError('Cannot create tasks without an authenticated user token.');
        }

        const taskInput = normalizeTask(payload);

        try {
          const response = await axios.post(
            `${userData.apiBaseUrl.replace(/\/$/, '')}/tasks`,
            taskInput,
            {
              headers: {
                Authorization: `Bearer ${userData.authToken}`,
                'Content-Type': 'application/json',
              },
              timeout: 15000,
            },
          );

          await publishData(room, {
            type: 'task_created',
            task: response.data,
          });

          return {
            success: true,
            taskId: response.data?._id ?? response.data?.id ?? null,
            title: response.data?.title,
          };
        } catch (error) {
          const reason = formatAxiosError(error);
          logger.error(`Failed to create task: ${reason}`);
          throw new ToolError(`Unable to create task: ${reason}`);
        }
      },
    }),
  };
}

function normalizeTask(task: TaskDraft): TaskDraft {
  return {
    ...task,
    dueDate: task.dueDate || undefined,
    tags: task.tags && task.tags.length > 0 ? task.tags : undefined,
    projectName: task.projectName || undefined,
  };
}

function getApiBaseUrl() {
  return (
    process.env.BACKEND_API_URL ?? process.env.API_BASE_URL ?? 'http://localhost:3000'
  );
}

function applyParticipantMetadata(session: any, participant: { metadata?: string | null; identity?: string }) {
  const parsed = parseParticipantMetadata(participant.metadata);

  if (parsed.userId) {
    session.userData.userId = parsed.userId;
  }
  if (parsed.authToken) {
    session.userData.authToken = parsed.authToken;
  }
  if (parsed.apiBaseUrl) {
    session.userData.apiBaseUrl = parsed.apiBaseUrl;
  }
}

function parseParticipantMetadata(metadata?: string | null): Partial<AgentUserData> {
  if (!metadata) {
    return {};
  }

  try {
    const parsed = JSON.parse(metadata);
    return {
      userId: parsed.userId,
      authToken: parsed.authToken,
      apiBaseUrl: parsed.apiBaseUrl,
    };
  } catch {
    return {};
  }
}

function registerTranscriptBridge(room: any, session: any) {
  const handler = (event: any) => {
    const transcriptSegment = event.transcriptSegments?.[0];
    if (!transcriptSegment) {
      return;
    }

    publishData(room, {
      type: 'transcript',
      text: transcriptSegment.text,
      isFinal: transcriptSegment.final,
    });
  };

  session.on(AgentSessionEventTypes.UserInputTranscribed, handler);
}

function registerConfirmationBridge(room: any, session: any) {
  const handler = (event: { data: Uint8Array; participant?: { identity?: string } }) => {
    const decoded = Buffer.from(event.data).toString('utf8');
    let data: any;
    try {
      data = JSON.parse(decoded);
    } catch {
      return;
    }

    if (data.type !== 'confirm_tasks') {
      return;
    }

    const userInput = data.confirmed
      ? 'Yes, those task details look good. Please create them now.'
      : 'No, those details are not correct yet.';

    try {
      session.generateReply({ userInput });
    } catch (error) {
      logger.error(`Failed to process confirmation message: ${formatError(error)}`);
    }
  };

  room.on(RoomEvent.DataReceived, handler);
  room.once(RoomEvent.Disconnected, () => {
    room.off(RoomEvent.DataReceived, handler);
  });
}

async function publishData(room: any, payload: unknown) {
  const localParticipant = room.localParticipant;
  if (!localParticipant) {
    return;
  }

  try {
    const buffer = Buffer.from(JSON.stringify(payload));
    await localParticipant.publishData(buffer, { reliable: true });
  } catch (error) {
    logger.error(`Failed to publish data message: ${formatError(error)}`);
  }
}

function formatAxiosError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return (
      axiosError.response?.data?.message ||
      axiosError.response?.statusText ||
      axiosError.message ||
      'request failed'
    );
  }
  return formatError(error);
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Run the agent worker with LiveKit CLI
// This MUST be the entry point - do not spawn this file as a child process from NestJS
if (require.main === module) {
  console.log('Starting LiveKit agent worker...');
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
  });

  const wsURL = process.env.LIVEKIT_URL || process.env.LIVEKIT_WS_URL;
  console.log('LIVEKIT_WS_URL:', wsURL);
  console.log('LIVEKIT_API_KEY:', process.env.LIVEKIT_API_KEY ? '****' : 'MISSING');
  console.log('LIVEKIT_API_SECRET:', process.env.LIVEKIT_API_SECRET ? '****' : 'MISSING');

  try {
    cli.runApp(
      new WorkerOptions({
        agent: __filename,
        wsURL,
        apiKey: process.env.LIVEKIT_API_KEY,
        apiSecret: process.env.LIVEKIT_API_SECRET,
        logLevel: 'debug',
      }),
    );
  } catch (error) {
    console.error('Failed to start agent:', error);
  }
}
