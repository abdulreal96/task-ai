# Backend Implementation Plan - AI Task Manager

## 📋 Overview
This document provides a step-by-step implementation guide for the NestJS backend with MongoDB and AI integration.

---

## 🎯 Audio Processing Strategy

### **Audio Transcription Approach**

#### **Option 1: OpenAI Whisper API (Recommended)**
- **Why**: Industry-leading accuracy, handles Nigerian English well, simple integration
- **Cost**: ~$0.006 per minute of audio
- **Implementation**: 
  ```typescript
  // Use OpenAI Whisper API
  npm install openai
  
  // In AI service
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    language: "en",
    response_format: "json"
  });
  ```
- **Pros**: 
  - Excellent accuracy for accents
  - Built-in noise reduction
  - Fast processing
  - No server management needed
- **Cons**: 
  - External dependency
  - Requires API credits

#### **Option 2: Your Ubuntu Server AI Agent**
- **Why**: You already have it running, no extra cost
- **Implementation**: 
  ```typescript
  // Send audio file to your AI agent
  const formData = new FormData();
  formData.append('audio', audioFile);
  
  const response = await axios.post(`${AI_AGENT_URL}/transcribe`, formData, {
    headers: { 'Authorization': `Bearer ${AI_AGENT_API_KEY}` }
  });
  ```
- **Pros**: 
  - Full control
  - No recurring costs
  - Can customize for Nigerian English
- **Cons**: 
  - Need to ensure server uptime
  - Need to implement/train model

#### **Option 3: Hybrid Approach (Best)**
- **Primary**: Your AI agent for transcription
- **Fallback**: OpenAI Whisper if your agent is down
- **Post-processing**: Use GPT-4 to clean grammar and extract task details
- **Flow**:
  ```
  Audio File → Your AI Agent (Transcribe) → Raw Text
    ↓
  GPT-4 API (Clean grammar + Extract task) → Structured Task Data
    ↓
  Save to MongoDB
  ```

### **Recommended: Hybrid with GPT-4**
```typescript
// Step 1: Transcribe with your AI agent
const transcription = await yourAIAgent.transcribe(audioFile);

// Step 2: Clean grammar and extract with GPT-4
const completion = await openai.chat.completions.create({
  model: "gpt-4-turbo",
  messages: [
    {
      role: "system",
      content: `You are a task management assistant. Clean up the grammar from this transcription 
                and extract task details. The user speaks Nigerian English. Extract:
                - Task title (concise)
                - Description
                - Suggested tags
                - Due date if mentioned
                - Status indicators (started, completed, etc.)`
    },
    {
      role: "user",
      content: transcription
    }
  ],
  response_format: { type: "json_object" }
});

const taskData = JSON.parse(completion.choices[0].message.content);
```

---

## 📁 Project Structure

```
task-ai/
├── frontend/                    # ✅ Already exists
│   ├── src/
│   ├── package.json
│   └── ...
├── backend/                     # 🆕 We'll create this
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/
│   │   ├── common/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── tasks/
│   │   ├── timer/
│   │   ├── tags/
│   │   ├── ai/
│   │   └── voice/
│   ├── test/
│   ├── uploads/                 # For temporary audio files
│   ├── .env.local
│   ├── .env.production
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── README.md
├── .gitignore                   # Root level
└── README.md                    # Root level
```

---

## 🚀 Step-by-Step Implementation

### **Phase 1: Project Setup (Day 1)**

#### Step 1.1: Initialize NestJS Project
```bash
cd c:\Users\DELL\Documents\GitHub\task-ai
npx @nestjs/cli new backend
# Choose npm as package manager
cd backend
```

#### Step 1.2: Install Dependencies
```bash
# Core dependencies
npm install @nestjs/mongoose mongoose
npm install @nestjs/config
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install bcrypt class-validator class-transformer

# AI & Voice processing
npm install openai
npm install axios form-data
npm install @nestjs/platform-express multer
npm install @types/multer --save-dev

# Utilities
npm install @nestjs/throttler
npm install helmet
npm install compression

# Dev dependencies
npm install --save-dev @types/bcrypt
npm install --save-dev @types/passport-jwt
```

#### Step 1.3: Create .env files
```bash
# Create .env.local
echo NODE_ENV=development > .env.local
echo PORT=3000 >> .env.local

# Create .env.production
echo NODE_ENV=production > .env.production
echo PORT=3000 >> .env.production
```

#### Step 1.4: Create .gitignore
```
# Dependencies
node_modules/
npm-debug.log
yarn-error.log

# Environment files
.env
.env.local
.env.production
.env.*.local

# Build files
/dist
/build
*.js.map

# Uploads
/uploads/*
!/uploads/.gitkeep

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
/coverage
/.nyc_output

# Logs
logs/
*.log
```

#### Step 1.5: Configure Environment
Create `src/config/configuration.ts`:
```typescript
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  environment: process.env.NODE_ENV || 'development',
  database: {
    uri: process.env.MONGODB_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION || '15m',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
  },
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    agentUrl: process.env.AI_AGENT_URL,
    agentApiKey: process.env.AI_AGENT_API_KEY,
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
    destination: process.env.UPLOAD_DIR || './uploads',
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8081'],
  },
});
```

---

### **Phase 2: Database Setup (Day 1-2)**

#### Step 2.1: Configure MongoDB Module
Update `app.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: `.env.${process.env.NODE_ENV || 'local'}`,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

#### Step 2.2: Create Schemas

**User Schema** (`src/users/schemas/user.schema.ts`):
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  avatar?: string;

  @Prop({
    type: {
      theme: { type: String, enum: ['light', 'dark'], default: 'light' },
      colorScheme: { type: String, enum: ['blue', 'purple', 'green', 'orange'], default: 'blue' },
      notifications: { type: Boolean, default: true },
    },
    default: {},
  })
  preferences: {
    theme: string;
    colorScheme: string;
    notifications: boolean;
  };

  @Prop()
  refreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

**Task Schema** (`src/tasks/schemas/task.schema.ts`):
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class Activity {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: Date.now })
  timestamp: Date;
}

@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ enum: ['todo', 'in-progress', 'completed'], default: 'todo', index: true })
  status: string;

  @Prop({ type: Date, index: true })
  dueDate?: Date;

  @Prop({ default: 0 })
  timeLogged: number;

  @Prop({ enum: ['low', 'medium', 'high'], default: 'medium' })
  priority: string;

  @Prop({ enum: ['voice', 'manual'], default: 'manual' })
  createdVia: string;

  @Prop({ type: [Activity], default: [] })
  activities: Activity[];
}

export const TaskSchema = SchemaFactory.createForClass(Task);
```

**TimerSession Schema** (`src/timer/schemas/timer-session.schema.ts`):
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class TimerSession extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true, index: true })
  taskId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  startTime: Date;

  @Prop()
  endTime?: Date;

  @Prop({ default: 0 })
  pausedDuration: number;

  @Prop({ default: 0 })
  totalDuration: number;

  @Prop({ enum: ['active', 'paused', 'completed'], default: 'active' })
  status: string;
}

export const TimerSessionSchema = SchemaFactory.createForClass(TimerSession);
```

---

### **Phase 3: Authentication (Day 2-3)**

#### Step 3.1: Create Auth Module
```bash
nest g module auth
nest g service auth
nest g controller auth
```

#### Step 3.2: Implement JWT Strategy

#### Step 3.3: Create Auth Guards

#### Step 3.4: Implement Login/Register

---

### **Phase 4: Task Management (Day 3-4)**

#### Step 4.1: Create Tasks Module
```bash
nest g module tasks
nest g service tasks
nest g controller tasks
```

#### Step 4.2: Implement CRUD Operations

#### Step 4.3: Add Filtering & Search

---

### **Phase 5: AI Integration (Day 4-5)**

#### Step 5.1: Create AI Module
```bash
nest g module ai
nest g service ai
```

#### Step 5.2: Implement AI Service

**AI Service** (`src/ai/ai.service.ts`):
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import axios from 'axios';

@Injectable()
export class AiService {
  private openai: OpenAI;
  private aiAgentUrl: string;
  private aiAgentApiKey: string;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('ai.openaiApiKey'),
    });
    this.aiAgentUrl = this.configService.get<string>('ai.agentUrl');
    this.aiAgentApiKey = this.configService.get<string>('ai.agentApiKey');
  }

  // Step 1: Transcribe using your AI agent
  async transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('audio', new Blob([audioBuffer]), filename);

      const response = await axios.post(
        `${this.aiAgentUrl}/transcribe`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.aiAgentApiKey}`,
            ...formData.getHeaders(),
          },
        }
      );

      return response.data.transcription;
    } catch (error) {
      // Fallback to OpenAI Whisper if your agent fails
      return this.transcribeWithWhisper(audioBuffer, filename);
    }
  }

  // Fallback: OpenAI Whisper
  async transcribeWithWhisper(audioBuffer: Buffer, filename: string): Promise<string> {
    const file = new File([audioBuffer], filename);
    const transcription = await this.openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en',
    });
    return transcription.text;
  }

  // Step 2: Extract task details using GPT-4
  async extractTaskFromTranscription(transcription: string) {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a task management assistant. Extract task details from this transcription.
                    The user speaks Nigerian English, so clean up grammar.
                    Return JSON with: title, description, tags (array), hasDueDate (boolean), 
                    dueDate (ISO string if mentioned), priority (low/medium/high).`,
        },
        {
          role: 'user',
          content: transcription,
        },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  // Process natural language commands
  async processCommand(command: string, context?: any) {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a task assistant. Interpret this command and return JSON with:
                    intent (update_status, add_tag, set_due_date, start_timer),
                    newStatus (if applicable), tags (if applicable), dueDate (if applicable).
                    Context: ${JSON.stringify(context)}`,
        },
        {
          role: 'user',
          content: command,
        },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(completion.choices[0].message.content);
  }
}
```

---

### **Phase 6: Voice Processing (Day 5-6)**

#### Step 6.1: Create Voice Module
```bash
nest g module voice
nest g service voice
nest g controller voice
```

#### Step 6.2: Configure Multer for File Upload

#### Step 6.3: Implement Voice Endpoints

---

### **Phase 7: Timer System (Day 6-7)**

#### Step 7.1: Create Timer Module

#### Step 7.2: Implement Timer Logic

---

### **Phase 8: Testing & Deployment (Day 7-8)**

#### Step 8.1: Add Swagger Documentation

#### Step 8.2: Docker Configuration

#### Step 8.3: GitHub Actions CI/CD

---

## 📝 Detailed Task Checklist

### Phase 1: Setup ✅
- [ ] Initialize NestJS project in `backend/` folder
- [ ] Install all dependencies
- [ ] Create .env.local and .env.production
- [ ] Create .gitignore
- [ ] Configure ConfigModule
- [ ] Set up MongoDB connection
- [ ] Test database connection

### Phase 2: Database ✅
- [ ] Create User schema with indexes
- [ ] Create Task schema with indexes
- [ ] Create TimerSession schema
- [ ] Create Tag schema
- [ ] Add schema validation
- [ ] Test schema creation

### Phase 3: Authentication 🔐
- [ ] Create Users module
- [ ] Implement password hashing
- [ ] Create JWT strategy
- [ ] Create Auth guards
- [ ] POST /auth/register endpoint
- [ ] POST /auth/login endpoint
- [ ] POST /auth/refresh endpoint
- [ ] POST /auth/logout endpoint
- [ ] Test authentication flow

### Phase 4: Tasks 📋
- [ ] Create Tasks module
- [ ] GET /tasks (with filters)
- [ ] GET /tasks/:id
- [ ] POST /tasks
- [ ] PATCH /tasks/:id
- [ ] DELETE /tasks/:id
- [ ] GET /tasks/statistics
- [ ] Add activity tracking
- [ ] Test all endpoints

### Phase 5: AI Integration 🤖
- [ ] Create AI module
- [ ] Implement transcription (your agent + Whisper fallback)
- [ ] Implement GPT-4 task extraction
- [ ] Implement command processing
- [ ] Test with sample audio files
- [ ] Handle AI errors gracefully

### Phase 6: Voice 🎤
- [ ] Create Voice module
- [ ] Configure multer for audio uploads
- [ ] POST /voice/create-task endpoint
- [ ] POST /voice/update-task/:id endpoint
- [ ] POST /voice/transcribe endpoint
- [ ] Add file validation (size, type)
- [ ] Implement cleanup for old files
- [ ] Test voice-to-task flow

### Phase 7: Timer ⏱️
- [ ] Create Timer module
- [ ] POST /timer/start
- [ ] POST /timer/pause/:id
- [ ] POST /timer/resume/:id
- [ ] POST /timer/stop/:id
- [ ] GET /timer/active
- [ ] GET /timer/sessions/:taskId
- [ ] Calculate accumulated time
- [ ] Test timer accuracy

### Phase 8: Tags 🏷️
- [ ] Create Tags module
- [ ] GET /tags
- [ ] POST /tags
- [ ] DELETE /tags/:id
- [ ] Auto-create tags from AI
- [ ] Update tag counts
- [ ] Test tag operations

### Phase 9: Polish 🎨
- [ ] Add Swagger documentation
- [ ] Add rate limiting
- [ ] Add compression
- [ ] Add helmet for security
- [ ] Add CORS configuration
- [ ] Add health check endpoint
- [ ] Write README
- [ ] Create Postman collection

### Phase 10: Deployment 🚀
- [ ] Create Dockerfile
- [ ] Create docker-compose.yml
- [ ] Set up GitHub Actions
- [ ] Deploy to production
- [ ] Test production environment
- [ ] Monitor logs

---

## 🎯 Audio Processing Tools Summary

| Tool | Purpose | Cost | Accuracy | Our Use |
|------|---------|------|----------|---------|
| **Your AI Agent** | Transcription | Free | Custom | Primary transcriber |
| **OpenAI Whisper** | Transcription fallback | $0.006/min | 95%+ | Backup when agent is down |
| **GPT-4 Turbo** | Grammar cleanup + Task extraction | $0.01/1K tokens | Excellent | Post-processing |

**Recommended Flow:**
```
Audio → Your AI Agent (transcribe) → GPT-4 (clean + extract) → MongoDB
         ↓ (if fails)
      OpenAI Whisper
```

---

## 📞 Next Steps

1. **Provide the following**:
   - Your AI agent URL: `http://your-ubuntu-ip:port`
   - AI agent API endpoints and authentication
   - MongoDB URI (dev + production)
   - OpenAI API key (if using GPT-4)

2. **Review this plan**:
   - Any changes needed?
   - Any additional features?

3. **Start implementation**:
   - I'll create the backend folder structure
   - Begin Phase 1 setup

Ready to proceed? 🚀
