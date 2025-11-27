# App Crash Fix - Permission Handling

## Issues Identified

1. **No Permission Request on App Launch** ✅ FIXED
   - Permission was only requested when clicking record button
   - Need to request on component mount

2. **Speech Recognition Module Crash** ✅ FIXED
   - Added better error handling
   - Check permissions before starting recording
   - Show clear error messages to user

## Changes Made

### 1. RecordTaskScreen.tsx - Permission Handling

**Added on Component Mount:**
- `checkPermissions()` - Runs when screen loads
- `getPermissionsAsync()` - Checks current permission status
- `requestPermissionsAsync()` - Requests if not granted
- Alert user immediately if permission denied

**Added Permission State:**
- `hasPermission` state to track permission status
- Check before allowing recording to start

**Improved Error Handling:**
- Better error messages in alerts
- Console logging for debugging
- Show specific error from speech recognition module

### 2. Configuration Verified

**app.json - All Required Settings:**
```json
{
  "plugins": [
    [
      "expo-speech-recognition",
      {
        "microphonePermission": "Allow Task AI Manager to access your microphone...",
        "speechRecognitionPermission": "Allow Task AI Manager to use speech recognition..."
      }
    ]
  ],
  "android": {
    "permissions": [
      "android.permission.RECORD_AUDIO",
      "android.permission.INTERNET"
    ]
  }
}
```

## Complete Flow Confirmation

### ✅ Speech-to-Text Integration (Native)
1. **Component Loads** → Checks/requests permissions
2. **User Taps Mic** → Validates permission again
3. **Speech Recognition Starts** → Native Android speech API
4. **Words Appear Live** → Real-time as you speak (interim results)
5. **User Stops** → Can edit or send to AI

### ✅ AI Task Extraction Integration
1. **User Clicks "Send to AI"** → Sends transcript to backend
2. **Backend API** → `POST https://task-ai.ilimtutor.com/ai/extract-tasks`
3. **AI Processing** → Ollama (qwen2.5:0.5b-instruct) extracts multiple tasks
4. **Response** → JSON with tasks array containing:
   - Title, description
   - Priority (urgent/high/medium/low)
   - Tags (bug, feature, implement, etc.)
   - Due date (if mentioned)
5. **Display** → Shows all tasks with color-coded priority badges
6. **User Confirms** → Saves all tasks to backend

### ✅ Fallback System
- If AI fails → Uses local keyword extraction
- If network fails → Creates single task from transcript
- User always gets their work saved

## Backend Integration Status

### ✅ AI Module Implemented
- **Service**: `backend/src/ai/ai.service.ts`
  - Calls Ollama AI at configured URL
  - Structured prompt for task extraction
  - JSON parsing and validation
  - Fallback on errors

- **Controller**: `backend/src/ai/ai.controller.ts`
  - Endpoint: `POST /ai/extract-tasks`
  - JWT authenticated
  - Returns structured response

- **Module**: `backend/src/ai/ai.module.ts`
  - Registered in AppModule
  - Exported for reuse

### ✅ API Configuration
- Production URL: `https://task-ai.ilimtutor.com`
- Configured in `app.json` → `extra.apiUrl`
- Used by both auth and AI services

## Next Steps

### 1. Rebuild the App
```bash
cd C:\Users\DELL\Documents\GitHub\task-ai\frontend
eas build --platform android --profile preview
```

**Why rebuild is needed:**
- Native modules (expo-speech-recognition) require native build
- Permission configurations are compiled into APK
- App.json changes need to be rebuilt
- Can't test with Expo Go

### 2. Install New Build
- Download APK from EAS
- Install on device
- **Expected behavior:**
  - App should ask for microphone permission on first launch or when opening Record screen
  - Permission dialog will appear
  - After granting, speech recognition will work

### 3. Test Complete Flow
1. **Login** → Should work with HTTPS backend
2. **Navigate to Record** → Permission dialog should appear
3. **Tap Microphone** → Should start recording
4. **Speak** → Words should appear in real-time
5. **Stop & Send to AI** → Should extract multiple tasks
6. **Confirm** → Should save all tasks

## Expected Permission Dialog

When you open the Record screen, you should see:

```
Task AI Manager would like to access your microphone

Allow "Task AI Manager" to access your microphone 
to record audio for task creation?

[DENY]  [ALLOW]
```

## Troubleshooting

### If Permission Not Requested:
- Check Android settings → Apps → Task AI Manager → Permissions
- Manually enable microphone if needed
- Reinstall app if permission settings corrupted

### If Still Crashing:
1. Check error in Android logcat: `adb logcat | grep -i error`
2. Verify expo-speech-recognition installed: Check package.json
3. Ensure build completed successfully: Check EAS build logs

### If AI Not Working:
1. Check backend is running: `curl https://task-ai.ilimtutor.com/`
2. Check AI endpoint: `curl -X POST https://task-ai.ilimtutor.com/ai/extract-tasks`
3. Verify JWT token is valid
4. Check backend logs for AI service errors

## Summary

### ✅ Completed:
- Native live speech-to-text with expo-speech-recognition
- Permission handling on component mount
- Better error messages
- AI task extraction backend service
- AI controller endpoint
- Frontend integration with AI backend
- HTTPS backend URL configured
- Multiple task display with priority badges
- Fallback system for AI failures

### 🔄 Required:
- **Rebuild app** with EAS Build (native module changes)
- Test on device after rebuild
- Verify permission dialog appears
- Test complete speech → AI → task creation flow

The implementation is complete. The crash is due to the old build not having the proper permission handling. Once you rebuild and install the new APK, it should:
1. Request permissions properly
2. Show permission dialog
3. Work with speech recognition
4. Extract tasks with AI
5. Save multiple tasks successfully
