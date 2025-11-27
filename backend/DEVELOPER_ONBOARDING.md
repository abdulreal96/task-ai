# Backend Developer Onboarding Guide

Welcome! This guide will help you understand the Task AI backend architecture and what's already built.

---

## 📋 System Summary

**Task AI Backend** is a NestJS-powered REST API that enables voice-based task management with intelligent AI processing. The system handles user authentication, task CRUD operations, and integrates with Ollama AI to extract structured task data from natural language voice transcripts.

**Key Capabilities:**
- **Smart Authentication**: JWT-based auth with email OTP verification, password reset, and refresh token rotation
- **Voice-to-Task Pipeline**: Users speak → Frontend transcribes → Backend AI extracts tasks with titles, priorities, tags, and due dates
- **Conversational AI**: When user input is unclear, AI asks clarifying questions before creating tasks
- **Task Management**: Full CRUD with status tracking, priority levels, timer functionality, and activity logs
- **Secure & Scalable**: MongoDB database, rate limiting, CORS protection, and production-ready deployment

**Tech Stack:** NestJS + MongoDB + Ollama AI + JWT + Resend Email + TypeScript

---

## 🎯 What You're Working On

A **NestJS REST API** for a voice-powered task management app. Users speak tasks → AI extracts details → Tasks are saved.

---

## 📁 Project Structure

```
backend/src/
├── auth/          # User registration, login, JWT, OTP verification
├── users/         # User profile management
├── tasks/         # CRUD operations for tasks
├── ai/            # AI task extraction using Ollama
├── email/         # Email OTP service (Resend)
├── schemas/       # MongoDB models (User, Task, Tag, TimerSession)
└── config/        # Environment configuration
```

---

## ✅ What's Already Built

### 1. **Authentication System** (`auth/`)
- ✅ User registration with email OTP verification
- ✅ Login with JWT access + refresh tokens
- ✅ Password reset flow (forgot password + OTP)
- ✅ Logout (clears refresh token)

**Endpoints:**
```
POST /auth/register        - Create account
POST /auth/verify-otp      - Verify email with OTP
POST /auth/resend-otp      - Resend verification code
POST /auth/login           - Login user
POST /auth/refresh         - Refresh access token
POST /auth/logout          - Logout user
POST /auth/forgot-password - Request password reset
POST /auth/reset-password  - Reset password with OTP
POST /auth/me              - Get current user profile
```

---

### 2. **Task Management** (`tasks/`)
- ✅ Create, read, update, delete tasks
- ✅ Filter tasks by status (todo/in-progress/completed)
- ✅ Task statistics (total, completed, pending)
- ✅ Priority levels: low, medium, high, urgent
- ✅ Tags for categorization
- ✅ Timer tracking (start/stop/pause)

**Endpoints:**
```
POST   /tasks           - Create new task
GET    /tasks           - Get all user tasks (?status=todo)
GET    /tasks/stats     - Get task statistics
GET    /tasks/:id       - Get single task
PATCH  /tasks/:id       - Update task
DELETE /tasks/:id       - Delete task
```

**Task Schema:**
```typescript
{
  title: string,              // Required
  description: string,
  status: 'todo' | 'in-progress' | 'completed',
  priority: 'low' | 'medium' | 'high' | 'urgent',
  dueDate: Date,
  tags: string[],
  timeSpent: number,          // in seconds
  timerStatus: 'stopped' | 'running' | 'paused',
  voiceTranscription: string,
  aiGenerated: boolean
}
```

---

### 3. **AI Integration** (`ai/`)
- ✅ Ollama integration (qwen2.5:0.5b-instruct model)
- ✅ Extract tasks from voice transcripts
- ✅ Conversational clarification (AI asks follow-ups)
- ✅ Smart tag extraction
- ✅ Priority detection

**Endpoint:**
```
POST /ai/extract-tasks
Body: { 
  transcript: string,
  conversationHistory?: [{role: 'user'|'ai', content: string}]
}

Response: {
  success: boolean,
  tasks: ExtractedTask[],
  needsClarification?: boolean,      // AI needs more info
  clarificationQuestion?: string     // Question to ask user
}
```

---

### 4. **Email Service** (`email/`)
- ✅ Resend integration for OTP emails
- ✅ Email verification codes (6 digits)
- ✅ Password reset emails

---

### 5. **Database** (MongoDB)
**Collections:**
- `users` - User accounts with auth tokens
- `tasks` - All user tasks
- `tags` - Task tags (schema defined)
- `timer-sessions` - Timer history (schema defined)

---

## 🔑 Environment Setup

Create `.env.local` for development:

```env
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/task-ai

# JWT Secrets (use long random strings)
JWT_SECRET=your_jwt_secret_min_32_chars
REFRESH_TOKEN_SECRET=your_refresh_secret_min_32_chars
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d

# AI (Ollama server)
AI_AGENT_URL=http://194.163.150.173:11434
AI_AGENT_MODEL=qwen2.5:0.5b-instruct

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev

# CORS
CORS_ORIGIN=*
```

---

## 🚀 Running the Backend

```bash
# Install dependencies
npm install

# Development mode (auto-reload)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

**API runs on:** `http://localhost:3000`

---

## 🔒 Authentication Flow

1. User registers → Email with OTP sent
2. User verifies OTP → Receives `accessToken` + `refreshToken`
3. Frontend stores tokens in AsyncStorage
4. Protected routes require `Authorization: Bearer <accessToken>` header
5. Access token expires after 15 minutes → Use `/auth/refresh` with refresh token

**JWT Payload:**
```typescript
{
  sub: userId,        // User ID
  email: string,      // User email
  iat: timestamp,     // Issued at
  exp: timestamp      // Expiry
}
```

---

## 🧪 Testing Endpoints

**Example: Create Task**
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement login feature",
    "description": "Add JWT authentication",
    "priority": "high",
    "tags": ["backend", "auth"]
  }'
```

---

## 📦 Key Dependencies

- `@nestjs/core` - NestJS framework
- `@nestjs/mongoose` - MongoDB integration
- `@nestjs/jwt` - JWT authentication
- `@nestjs/passport` - Passport.js for auth strategies
- `bcrypt` - Password hashing
- `class-validator` - DTO validation
- `axios` - HTTP client for Ollama AI
- `resend` - Email service
- `helmet` - Security headers
- `compression` - Response compression

---

## 🎨 Code Patterns

### Controllers
```typescript
@Controller('resource')
@UseGuards(JwtAuthGuard)  // Protect all routes
export class ResourceController {
  @Post()
  create(@Request() req, @Body() dto: CreateDto) {
    return this.service.create(req.user._id, dto);
  }
}
```

### Services
```typescript
@Injectable()
export class ResourceService {
  constructor(
    @InjectModel(Resource.name) 
    private model: Model<ResourceDocument>
  ) {}
}
```

### DTOs (Data Transfer Objects)
```typescript
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: string;
}
```

---

## 🐛 Common Issues & Solutions

**MongoDB Connection Failed:**
- Check `MONGODB_URI` in `.env.local`
- Ensure MongoDB is running: `mongod`

**JWT Invalid Signature:**
- Verify `JWT_SECRET` matches between registration and login

**CORS Error:**
- Check `CORS_ORIGIN` allows your frontend URL
- Default is `*` (allow all origins)

**AI Extraction Failed:**
- Verify Ollama server is running at `AI_AGENT_URL`
- Test with: `curl http://194.163.150.173:11434/api/generate`

---

## 📚 Next Steps

You're now ready to contribute! Focus areas:
1. Review existing code in `auth/`, `tasks/`, and `ai/` modules
2. Test all endpoints with Postman or Thunder Client
3. Check MongoDB collections structure
4. Read the AI clarification flow in `ai.service.ts`

**Questions?** Check:
- `BACKEND_IMPLEMENTATION_PLAN.md` - Detailed implementation guide
- `README.md` - Project overview
- Code comments in service files

---

## 🔗 Related Links

- **Frontend:** `../frontend` (React Native Expo app)
- **Database:** MongoDB local or Atlas
- **AI Server:** Ollama at `http://194.163.150.173:11434`
- **Production URL:** `https://task-ai.ilimtutor.com`

Good luck! 🚀
