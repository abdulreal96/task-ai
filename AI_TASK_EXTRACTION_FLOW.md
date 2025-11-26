# Complete AI-Powered Task Extraction Flow

## ✅ CONFIRMED: Here's What Actually Happens Now

### 1. Speech-to-Text (Native & Live) 🎤
```
User speaks → Device's native speech recognition 
→ Words appear LIVE in input field (just like GitHub Copilot)
→ User stops recording
```

### 2. Transcript Sent to AI Backend 🤖
```
User clicks "Send to AI" 
→ POST http://194.163.150.173:3000/ai/extract-tasks
→ Payload: { transcript: "the full text..." }
→ Backend calls your Ollama AI (qwen2.5:0.5b-instruct)
```

### 3. AI Processing (Smart Extraction) 🧠
The AI receives a structured prompt asking it to:
- Identify ALL distinct tasks mentioned
- Extract for each task:
  - **Title** (max 60 chars)
  - **Description** (detailed)
  - **Priority** (low, medium, high, urgent)
  - **Tags** (bug, feature, implement, api, etc.)
  - **Due Date** (if mentioned - ISO format)

**Example AI Prompt:**
```
You are a task extraction assistant. Analyze the following transcript and extract all tasks mentioned.

TRANSCRIPT:
"I need to fix the login bug urgently and then implement the wallet feature by next Friday"

Return ONLY valid JSON:
{
  "tasks": [
    {
      "title": "Fix login bug",
      "description": "Fix the login bug urgently",
      "priority": "urgent",
      "tags": ["bug", "fix", "authentication"],
      "dueDate": null
    },
    {
      "title": "Implement wallet feature",
      "description": "Implement the wallet feature",
      "priority": "high",
      "tags": ["feature", "implement", "wallet"],
      "dueDate": "2025-12-06"
    }
  ]
}
```

### 4. AI Response Handling (Multiple Tasks) 📋
```
AI returns JSON with array of tasks
→ Frontend receives response
→ Shows confirmation screen with ALL extracted tasks
→ Each task displays:
  - Title
  - Description
  - Priority badge (color-coded)
  - Due date (if set)
  - Tags
```

**Priority Colors:**
- 🔴 Urgent: Red badge
- 🟠 High: Orange badge
- 🟡 Medium: Yellow badge
- 🔵 Low: Blue badge

### 5. Fallback System (Resilient) 🛡️
If AI fails (network error, API down, parsing error):
```
→ Uses local keyword extraction
→ Creates single task from transcript
→ User still gets their task saved
→ Shows alert explaining fallback was used
```

### 6. Confirmation & Saving (Batch Create) 💾
```
User reviews extracted tasks
→ Can edit individual tasks (future feature)
→ Clicks "Confirm"
→ Saves ALL tasks to backend in batch
→ Each task includes:
  - title
  - description
  - priority (from AI)
  - tags (from AI)
  - dueDate (from AI if mentioned)
  - status: 'todo'
  - timeSpent: 0
  - timerStatus: 'stopped'
```

## 🔧 Implementation Details

### Backend Files Created:
1. **`backend/src/ai/ai.service.ts`** - Core AI logic
   - Builds structured prompts
   - Calls Ollama API at `http://194.163.150.173:11434/api/generate`
   - Parses JSON responses
   - Handles errors with fallback
   - Validates priority levels

2. **`backend/src/ai/ai.controller.ts`** - REST API endpoint
   - Route: `POST /ai/extract-tasks`
   - Protected with JWT auth
   - Accepts: `{ transcript: string }`
   - Returns: `{ success: bool, tasks: [...], message: string }`

3. **`backend/src/ai/ai.module.ts`** - Module registration
   - Exports AiService for reuse
   - Registered in AppModule

### Frontend Changes:
1. **RecordTaskScreen.tsx** - Updated to:
   - Call real AI API with auth token
   - Handle network errors gracefully
   - Display multiple tasks with priority badges
   - Show due dates
   - Confirm all tasks at once

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER SPEAKS                                               │
│    "Fix login bug urgently and implement wallet by Friday"  │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. NATIVE SPEECH RECOGNITION (expo-speech-recognition)      │
│    - Words appear LIVE as user speaks                       │
│    - Continuous listening with interim results              │
│    - Auto punctuation                                        │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. TRANSCRIPT DISPLAYED                                      │
│    User can edit or click "Send to AI"                      │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. API CALL TO BACKEND                                       │
│    POST http://194.163.150.173:3000/ai/extract-tasks       │
│    Headers: Authorization: Bearer <token>                   │
│    Body: { transcript: "..." }                              │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. BACKEND CALLS OLLAMA AI                                   │
│    POST http://194.163.150.173:11434/api/generate          │
│    Model: qwen2.5:0.5b-instruct                             │
│    Prompt: Structured task extraction prompt                │
│    Response: JSON with tasks array                          │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. AI RETURNS STRUCTURED DATA                                │
│    {                                                         │
│      "tasks": [                                              │
│        {                                                     │
│          "title": "Fix login bug",                           │
│          "description": "...",                               │
│          "priority": "urgent",                               │
│          "tags": ["bug", "authentication"],                  │
│          "dueDate": null                                     │
│        },                                                    │
│        {                                                     │
│          "title": "Implement wallet feature",                │
│          "description": "...",                               │
│          "priority": "high",                                 │
│          "tags": ["feature", "wallet"],                      │
│          "dueDate": "2025-12-06"                             │
│        }                                                     │
│      ]                                                       │
│    }                                                         │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. FRONTEND DISPLAYS ALL TASKS                               │
│    ┌───────────────────────────────────────────────┐        │
│    │ ✓ I found 2 tasks                             │        │
│    │                                               │        │
│    │ ┌─────────────────────────────────────┐      │        │
│    │ │ Fix login bug              [URGENT] │      │        │
│    │ │ Fix the login bug urgently          │      │        │
│    │ │ [bug] [authentication]              │      │        │
│    │ └─────────────────────────────────────┘      │        │
│    │                                               │        │
│    │ ┌─────────────────────────────────────┐      │        │
│    │ │ Implement wallet feature   [HIGH]   │      │        │
│    │ │ Due: 12/6/2025                      │      │        │
│    │ │ [feature] [wallet]                  │      │        │
│    │ └─────────────────────────────────────┘      │        │
│    │                                               │        │
│    │ [Try Again]  [Confirm]                        │        │
│    └───────────────────────────────────────────────┘        │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. USER CONFIRMS - BATCH SAVE                                │
│    for each task in tasks:                                  │
│      POST http://194.163.150.173:3000/tasks                 │
│      Creates task with all AI-extracted data                │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. SUCCESS                                                   │
│    "2 tasks saved successfully"                              │
│    All tasks now appear in TaskBoard                        │
└─────────────────────────────────────────────────────────────┘
```

## 🛡️ Error Handling

### Scenario 1: AI API Unavailable
- Backend returns `{ success: false, tasks: [] }`
- Frontend uses local keyword extraction
- User gets 1 task saved (fallback)
- Alert: "Using fallback task extraction"

### Scenario 2: AI Returns Invalid JSON
- Backend catches parsing error
- Uses local keyword extraction
- Returns fallback task
- Logs error for debugging

### Scenario 3: Network Timeout
- Frontend catch block triggers
- Uses local extraction immediately
- Alert: "Could not reach AI server"
- Task still gets saved

### Scenario 4: AI Returns Empty Array
- Frontend treats as failure
- Uses local extraction
- Alert: "Using fallback task extraction"

## 🚀 Next Steps

1. **Build the app** with EAS Build (native module required)
2. **Deploy backend** with updated AI module
3. **Test** with real voice input:
   - Say: "Fix the login bug urgently and implement wallet feature by next Friday"
   - Expect: 2 tasks extracted with correct priorities and due date

## 📝 Configuration Required

### Backend Environment Variables:
```env
AI_AGENT_URL=http://194.163.150.173:11434/api/generate
AI_AGENT_MODEL=qwen2.5:0.5b-instruct
AI_AGENT_API_KEY=  # Optional if Ollama doesn't need auth
```

### Test the AI Endpoint:
```bash
curl -X POST http://194.163.150.173:3000/ai/extract-tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"transcript":"Fix login bug urgently and implement wallet by Friday"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Successfully extracted 2 task(s)",
  "tasks": [...]
}
```
