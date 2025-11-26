# Task AI - Backend API

NestJS backend for AI-powered task management application with voice input and intelligent task extraction.

## 🚀 Features

- **Voice-Powered Task Creation**: Upload audio → AI transcribes → Extracts task details
- **Natural Language Commands**: Update tasks using voice commands  
- **Smart Timer System**: Track time with pause/resume functionality
- **AI Integration**: Grammar cleanup + task extraction using GPT-4
- **MongoDB Database**: Fast, scalable NoSQL database
- **JWT Authentication**: Secure user authentication with refresh tokens
- **RESTful API**: Clean, well-documented API endpoints

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- OpenAI API Key (for GPT-4 and Whisper)
- AI Agent Server (optional, Ubuntu server)

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.local .env

# Update .env with your credentials
```

## 🏃 Running the Application

```bash
# Development mode
npm run start:dev

# Production mode  
npm run build
npm run start:prod
```

API available at `http://localhost:3000`

## 📚 Implementation Guide

See `/BACKEND_IMPLEMENTATION_PLAN.md` in root directory for:
- Detailed step-by-step implementation
- Audio processing strategy
- Database schema design
- API endpoints documentation
- Phase-by-phase checklist

## 🤝 Related Projects

- **Frontend**: React Native mobile app (Expo) in `/frontend`
- **AI Agent**: Custom transcription server on Ubuntu

## 📞 Contact

For questions, refer to `BACKEND_IMPLEMENTATION_PLAN.md`
