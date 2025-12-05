# Development Build Setup Guide (No Android Studio Required)

This guide helps you test the app with native modules (speech recognition) without installing Android Studio.

## Prerequisites

1. **Physical Android Device** (recommended) or Android Emulator
2. **EAS CLI** installed globally
3. **Expo Account** (free tier works)

## Setup Steps

### 1. Install EAS CLI (if not already installed)

```bash
npm install -g eas-cli
```

### 2. Login to Expo

```bash
cd frontend
eas login
```

### 3. Configure Your Project

```bash
eas build:configure
```

This will set up your project for EAS builds.

### 4. Build Development Version

**Option A: Build in the Cloud (Recommended - No local setup needed)**

```bash
eas build --profile development --platform android
```

This builds your app on EAS servers and gives you a downloadable APK. Takes 10-15 minutes.

**Option B: Build Locally (Requires some Android tools but NOT full Android Studio)**

```bash
eas build --profile development --platform android --local
```

This requires:
- Android SDK (lightweight, ~500MB)
- No Android Studio needed

### 5. Install the Development Build

After the build completes:

1. **Cloud Build**: Download the APK from the EAS website link
2. **Local Build**: APK will be in your project folder
3. Install on your device:
   ```bash
   adb install path/to/app.apk
   ```
   Or transfer the APK to your device and install manually

### 6. Start Development Server

```bash
npm start
```

Then press `a` to open on Android, or scan QR code with your development build app.

## How It Works

- **Development Build** = Custom Expo Go with YOUR native modules
- Works like Expo Go but includes `expo-speech-recognition`
- Hot reload still works
- No need to rebuild for code changes (only for native module changes)

## Alternative: Prebuild Approach

If EAS doesn't work, you can use Expo prebuild to generate native folders and run locally:

### 1. Generate Native Folders

```bash
cd frontend
npx expo prebuild --clean
```

This creates `android/` and `ios/` folders.

### 2. Run Without Android Studio

**Using Gradle directly:**

```bash
# Build APK
cd android
./gradlew assembleDebug

# Install on device
adb install app/build/outputs/apk/debug/app-debug.apk
```

**Or use Expo CLI:**

```bash
npx expo run:android
```

This uses Gradle under the hood, no Android Studio needed.

### 3. Development with Metro

```bash
npm start
```

The app will connect to Metro bundler for hot reload.

## Troubleshooting

### "adb not found"

Install Android SDK Platform Tools:
- Download from: https://developer.android.com/tools/releases/platform-tools
- Extract and add to PATH
- Test: `adb devices`

### Device Not Detected

```bash
adb devices
adb kill-server
adb start-server
```

Enable USB debugging on your Android device.

### Build Failed

Check build logs on EAS dashboard or local terminal. Common issues:
- Network connectivity
- Expo account permissions
- Package.json dependency conflicts

## Which Approach to Use?

| Approach | Pros | Cons |
|----------|------|------|
| **EAS Cloud Build** | ✅ No local setup<br>✅ Works on any machine<br>✅ Easy | ⏱️ Takes 10-15 min per build |
| **EAS Local Build** | ✅ Faster builds<br>✅ No cloud queue | 📦 Requires Android SDK |
| **Expo Prebuild** | ✅ Full control<br>✅ No EAS needed | 📦 Requires Android SDK<br>⚙️ More complex |

**Recommendation**: Start with **EAS Cloud Build** (development profile). It's the easiest and requires zero local setup.

## Testing Speech Recognition

Once installed:

1. Open the development build app
2. Scan QR from `npm start`
3. Navigate to "Record Task" screen
4. Test speech recognition - it should work!

## Cost

EAS builds are **free** for:
- 30 builds/month on free tier
- Development builds included

No credit card required for testing.
