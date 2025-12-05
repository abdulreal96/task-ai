# Quick Setup Script for Development Build

## Step 1: Install expo-dev-client

cd frontend
npm install expo-dev-client

## Step 2: Update app.json (if needed)

The app.json should already be configured, but verify it has:
- expo.plugins array with "expo-speech-recognition"

## Step 3: Choose Your Build Method

### Method A: EAS Cloud Build (EASIEST - No Android Studio)

# Install EAS CLI globally
npm install -g eas-cli

# Login
eas login

# Build development version (takes ~10-15 minutes)
eas build --profile development --platform android

# After build completes, download APK from link and install on device

### Method B: Expo Prebuild + Local Gradle (No Android Studio needed)

# Generate native folders
npx expo prebuild --clean

# Build APK using Gradle
cd android
./gradlew assembleDebug

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
# Install via: adb install app-debug.apk

## Step 4: Start Development

npm start

# Open the custom development build app on your device
# Scan the QR code
# Speech recognition will work!

## Testing Speech Recognition

1. Open app
2. Navigate to "Record Task" tab
3. Tap mic button
4. Speak your task
5. Should transcribe correctly!

## Note

- **Development builds** need to be rebuilt only when:
  - Adding/removing native modules
  - Changing native configurations
  
- **Code changes** (JS/TS) hot reload instantly - no rebuild needed!
