# Task AI Manager - Frontend

A React Native mobile application for AI-powered task management built with Expo SDK 51.

## 🚀 Features

- **Dashboard**: Overview of all tasks with statistics and recent activity
- **Task Board**: Kanban-style board to manage tasks by status (To Do, In Progress, Done)
- **Voice Recording**: Create tasks using voice input (AI-powered)
- **Reports**: Productivity insights with charts and analytics
- **Settings**: Customize app preferences and manage account

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo Go app on your mobile device (iOS or Android)
  - iOS: Download from App Store
  - Android: Download from Google Play Store

## 🛠️ Tech Stack

- **React Native**: 0.74.1
- **Expo SDK**: 51.0.0
- **React**: 18.2.0
- **TypeScript**: 5.1.3
- **React Navigation**: Bottom tabs and stack navigation
- **Lucide React Native**: Icon library

## 📦 Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## 🏃 Running the App

1. Start the Expo development server:
```bash
npx expo start
```

2. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

3. Alternative commands:
```bash
# Run on Android emulator
npx expo start --android

# Run on iOS simulator (Mac only)
npx expo start --ios

# Run on web browser
npx expo start --web
```

## 📱 Using with Expo Go

**Version Requirements:**
- Expo Go SDK: 51
- Client Version: 2.31.2

1. Open Expo Go app on your mobile device
2. Scan the QR code displayed in the terminal
3. Wait for the app to build and load

## 📂 Project Structure

```
frontend/
├── App.tsx                 # Main app entry with navigation
├── app.json               # Expo configuration
├── babel.config.js        # Babel configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── src/
    ├── context/
    │   └── TaskContext.tsx    # Global state management
    └── screens/
        ├── DashboardScreen.tsx    # Home dashboard
        ├── TaskBoardScreen.tsx    # Task kanban board
        ├── RecordTaskScreen.tsx   # Voice/manual task creation
        ├── ReportsScreen.tsx      # Analytics and reports
        └── SettingsScreen.tsx     # App settings
```

## 🎨 Screens Overview

### Dashboard
- Quick stats (Total tasks, In Progress, Completed, Time Logged)
- Recent tasks list
- Visual progress indicators

### Task Board
- Kanban board with three columns (To Do, In Progress, Done)
- Task filtering by status
- Task detail modal with activity log
- Status update and task deletion

### Record Task
- Voice recording button for AI-powered task creation
- Manual input form with title, description, and tags
- Quick tag selection
- Form validation

### Reports
- Period selector (Week, Month, Year)
- Key metrics cards
- Completion rate visualization
- Task distribution progress bars
- Top tags ranking

### Settings
- Profile management
- Notification preferences
- Dark mode toggle
- Auto sync settings
- Data management
- Logout functionality

## 🔧 Configuration

### Expo Configuration (app.json)
```json
{
  "expo": {
    "name": "Task AI Manager",
    "slug": "task-ai-frontend",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      }
    }
  }
}
```

## 🎯 Current Status

### ✅ Completed
- Project setup with Expo SDK 51
- All screen UI implementations
- Navigation structure (Bottom tabs)
- Global state management with Context API
- Dummy data for testing
- TypeScript configuration

### 🚧 To Be Implemented
- Backend API integration
- Voice recording with Expo AV
- AI-powered task processing
- User authentication
- Data persistence
- Push notifications
- Dark mode theme

## 🔌 API Integration

All screens currently use dummy data. API endpoints to be connected:

```typescript
// Task Context - Add API calls
const addTask = async (task: Task) => {
  // TODO: POST /api/tasks
  // const response = await fetch('/api/tasks', {...});
};

const updateTask = async (id: string, updates: Partial<Task>) => {
  // TODO: PUT /api/tasks/:id
};

const deleteTask = async (id: string) => {
  // TODO: DELETE /api/tasks/:id
};
```

## 📊 State Management

Using React Context API for global state:

```typescript
// Available Context Hooks
const { tasks, tags, addTask, updateTask, deleteTask } = useTasks();
```

### Task Type Definition
```typescript
type Task = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  status: 'todo' | 'in-progress' | 'completed';
  timeLogged: number;
  createdAt: Date;
  updatedAt: Date;
  activities: Activity[];
};
```

## 🎨 Design System

### Colors
- Primary: `#6366f1` (Indigo)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Amber)
- Error: `#ef4444` (Red)
- Secondary: `#8b5cf6` (Purple)
- Info: `#3b82f6` (Blue)

### Typography
- Title: 32px, Bold
- Subtitle: 16px, Regular
- Heading: 20px, Semibold
- Body: 14-16px, Regular
- Caption: 12px, Regular

## 🧪 Testing

```bash
# Run TypeScript type checking
npx tsc --noEmit

# Clear Expo cache
npx expo start --clear
```

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler error**: Clear cache with `npx expo start --clear`
2. **Dependencies error**: Delete `node_modules` and run `npm install`
3. **Expo Go version mismatch**: Update Expo Go app from store
4. **Port already in use**: Kill the process on port 19000/19001

### Debugging

1. Shake device to open debug menu
2. Enable "Debug Remote JS" in debug menu
3. Use React Native Debugger or Chrome DevTools

## 📝 Development Guidelines

1. **File Naming**: PascalCase for components (e.g., `TaskBoardScreen.tsx`)
2. **Styling**: Use StyleSheet.create() for styles
3. **Types**: Always define TypeScript types for props and state
4. **Components**: Keep components focused and reusable
5. **State**: Use Context for global state, local state for component-specific

## 🚀 Building for Production

### Android APK
```bash
npx eas build --platform android
```

### iOS IPA
```bash
npx eas build --platform ios
```

## 📄 License

This project is part of the Task AI Manager monorepo.

## 🤝 Contributing

This is a monorepo project. See the main README for contribution guidelines.

---

Built with ❤️ using React Native and Expo
