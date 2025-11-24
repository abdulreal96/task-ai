# Task AI Manager - Monorepo

An AI-powered task management application with voice input capabilities. This monorepo contains both the mobile frontend (React Native) and backend API.

## 🎯 Project Overview

Task AI Manager helps users create and manage tasks efficiently using voice commands and AI processing. The app provides comprehensive task tracking, analytics, and productivity insights.

### Key Features

- 🎤 **Voice-to-Task**: Create tasks using voice commands with AI processing
- 📋 **Task Board**: Kanban-style board for visual task management
- 📊 **Analytics**: Track productivity with detailed reports and insights
- 🏷️ **Smart Tagging**: Automatic tag extraction and organization
- ⏱️ **Time Tracking**: Log time spent on each task
- 📱 **Mobile First**: Built with React Native for iOS and Android

## 📂 Project Structure

```
task-ai/
├── frontend/           # React Native mobile app (Expo SDK 51)
│   ├── src/
│   │   ├── screens/   # App screens
│   │   └── context/   # State management
│   ├── App.tsx
│   ├── package.json
│   └── README.md
├── backend/           # Node.js API (Coming soon)
│   └── ...
├── package.json       # Root package.json
└── README.md         # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v16 or higher
- **npm** or **yarn**
- **Expo Go** app on mobile device (iOS/Android)
- **Git**: For version control

### Installation

1. Clone the repository:
```bash
git clone https://github.com/abdulreal96/task-ai.git
cd task-ai
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Start the Expo development server:
```bash
npx expo start
```

4. Scan the QR code with Expo Go app on your mobile device

## 📱 Frontend (React Native)

### Tech Stack

- **Framework**: React Native 0.74.1
- **Platform**: Expo SDK 51.0.0
- **Language**: TypeScript 5.1.3
- **Navigation**: React Navigation (Bottom Tabs)
- **Icons**: Lucide React Native
- **State**: React Context API

### Running the Frontend

```bash
cd frontend

# Start development server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS (Mac only)
npx expo start --ios

# Run on web
npx expo start --web
```

### Frontend Features

- ✅ Dashboard with task statistics
- ✅ Task Board with status columns
- ✅ Voice/Manual task creation
- ✅ Reports and analytics
- ✅ Settings and preferences
- ⏳ Backend API integration (pending)
- ⏳ Voice recording with Expo AV (pending)
- ⏳ AI task processing (pending)

See [frontend/README.md](./frontend/README.md) for detailed documentation.

## 🔧 Backend (Coming Soon)

The backend API will provide:

- RESTful API endpoints
- AI-powered voice-to-task conversion
- User authentication and authorization
- Database integration
- Real-time updates

### Planned Tech Stack

- **Framework**: Node.js + Express or NestJS
- **Database**: PostgreSQL or MongoDB
- **AI/ML**: OpenAI API or custom NLP model
- **Authentication**: JWT tokens
- **Voice Processing**: Speech-to-text API

## 🎨 Design

The app design is based on Figma mockups:
- **Figma Project**: [Voice-Driven Task Tracker](https://www.figma.com/design/tdDchvmxBveYikVqJPRVnQ/Voice-Driven-Task-Tracker)

## 📊 Current Status

### Phase 1: Frontend Development ✅
- [x] Project setup with Expo SDK 51
- [x] Screen implementations
  - [x] Dashboard Screen
  - [x] Task Board Screen
  - [x] Record Task Screen
  - [x] Reports Screen
  - [x] Settings Screen
- [x] Navigation structure
- [x] State management with Context API
- [x] Dummy data for testing
- [x] TypeScript configuration

### Phase 2: Backend Development (Next)
- [ ] API server setup
- [ ] Database schema design
- [ ] Authentication system
- [ ] Voice-to-text integration
- [ ] AI task processing
- [ ] API documentation

### Phase 3: Integration
- [ ] Connect frontend to backend
- [ ] Implement voice recording
- [ ] Real-time task updates
- [ ] Push notifications
- [ ] Data persistence
- [ ] Error handling

### Phase 4: Enhancement
- [ ] Dark mode theme
- [ ] Offline support
- [ ] Performance optimization
- [ ] Unit and integration tests
- [ ] CI/CD pipeline
- [ ] Production deployment

## 🛠️ Development

### Code Structure

```
frontend/src/
├── screens/              # Screen components
│   ├── DashboardScreen.tsx
│   ├── TaskBoardScreen.tsx
│   ├── RecordTaskScreen.tsx
│   ├── ReportsScreen.tsx
│   └── SettingsScreen.tsx
└── context/
    └── TaskContext.tsx   # Global state management
```

### Key Components

#### TaskContext
Global state management for tasks and tags:
```typescript
const { tasks, tags, addTask, updateTask, deleteTask } = useTasks();
```

#### Navigation
Bottom tab navigation with 5 main screens:
- Dashboard
- Task Board
- Record Task
- Reports
- Settings

## 🎯 API Endpoints (Planned)

```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - User login
GET    /api/tasks              - Get all tasks
POST   /api/tasks              - Create new task
GET    /api/tasks/:id          - Get task details
PUT    /api/tasks/:id          - Update task
DELETE /api/tasks/:id          - Delete task
POST   /api/tasks/voice        - Create task from voice
GET    /api/reports/stats      - Get statistics
GET    /api/tags               - Get all tags
```

## 🧪 Testing

```bash
# Frontend type checking
cd frontend
npx tsc --noEmit

# Clear Expo cache
npx expo start --clear
```

## 📦 Building for Production

### Android
```bash
cd frontend
npx eas build --platform android
```

### iOS
```bash
cd frontend
npx eas build --platform ios
```

## 🤝 Contributing

This is currently a development project. Contribution guidelines will be added later.

### Development Workflow

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📝 License

This project is private and proprietary.

## 👤 Author

**Abdul Real**
- GitHub: [@abdulreal96](https://github.com/abdulreal96)

## 🗺️ Roadmap

### Q4 2025
- ✅ Frontend MVP (Completed)
- 🚧 Backend API development
- ⏳ Voice recording integration

### Q1 2026
- ⏳ AI task processing
- ⏳ User authentication
- ⏳ Beta testing

### Q2 2026
- ⏳ Production release
- ⏳ App Store submission
- ⏳ Play Store submission

## 📞 Support

For questions or issues, please create an issue on GitHub.

---

**Status**: 🚧 In Development  
**Current Version**: 1.0.0 (Frontend MVP)  
**Last Updated**: November 24, 2025

Built with ❤️ using React Native, Expo, and TypeScript
  