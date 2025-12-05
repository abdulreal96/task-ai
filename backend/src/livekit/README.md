# LiveKit Voice Agent

This directory contains the LiveKit voice agent for Task AI's speech-to-task functionality.

## Architecture

The LiveKit Agents SDK requires the agent to run as an **independent process** with the LiveKit CLI as the entry point. This is NOT a child process of NestJS - it must run separately.

### Why Separate Processes?

The LiveKit SDK uses `AsyncLocalStorage` to maintain job context throughout the agent's lifecycle. When the CLI (`cli.runApp()`) starts the agent, it:

1. Sets up the AsyncLocalStorage context
2. Forks child processes for each job with proper context propagation  
3. Manages WebSocket connections to LiveKit Cloud
4. Handles job dispatch and context initialization

**Spawning the agent worker as a child process from NestJS bypasses all of this**, causing the "no job context found" error.

## Running the Agent

### Development Mode

Open **two separate terminals**:

**Terminal 1 - NestJS API:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - LiveKit Agent:**
```bash
cd backend
npm run agent:dev
```

### Production Mode

```bash
# Build first
npm run build

# Terminal 1 - NestJS API
npm run start:prod

# Terminal 2 - LiveKit Agent
npm run agent:prod
```

## Environment Variables

The agent needs these variables (in `.env.local`):

```env
# Required
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_WS_URL=wss://your-project.livekit.cloud

# Optional
LIVEKIT_AGENT_NAME=task-ai-agent
LIVEKIT_AGENT_LOG_LEVEL=info
LIVEKIT_LLM_MODEL=openai/gpt-4o-mini
LIVEKIT_STT_MODEL=deepgram/nova-2-general:en
LIVEKIT_TTS_MODEL=cartesia/sonic

# For task creation
BACKEND_API_URL=http://localhost:3000
```

## Agent Architecture

### Entry Point (`agent.worker.ts`)

- Uses `defineAgent()` to declare the agent logic
- Must end with `cli.runApp()` call when run as main module
- Handles:
  - Speech-to-text transcription
  - LLM conversation management
  - Text-to-speech output
  - Task extraction and confirmation flow
  - Communication with mobile app via data messages

### Tool Functions

**`confirm_task_details`**
- Shows extracted tasks to user before saving
- Sends task list to mobile app UI
- Waits for explicit confirmation

**`create_task`**
- Persists confirmed tasks to backend API
- Requires user authentication token
- Notifies mobile app of created tasks

## Agent Workflow

1. User describes tasks verbally
2. Agent extracts task details (title, description, priority, due date, etc.)
3. Agent calls `confirm_task_details` tool, reading back the summary
4. Mobile app displays task preview
5. User confirms (voice or UI button)
6. Agent calls `create_task` for each confirmed task
7. Tasks saved to backend, user notified

## Debugging

### Check Agent Logs

The agent outputs detailed logs including:
- Job requests received
- Room connections
- Tool calls
- Errors and warnings

### Common Issues

**"no job context found"** - Agent MUST be started via `cli.runApp()`, not spawned as child process

**"Unable to initialize LiveKit logger"** - Non-critical warning, agent will still work

**"Cannot create tasks without an authenticated user token"** - Mobile app must pass auth token in participant metadata

## Mobile App Integration

The mobile app connects to LiveKit rooms and passes metadata:

```typescript
const metadata = JSON.stringify({
  userId: user.id,
  authToken: user.accessToken,
  apiBaseUrl: API_BASE_URL
});

// Pass to room.connect() options
