# GitHub Actions APK Build Setup

This workflow automatically builds your Android APK whenever you push to the `main` branch or manually trigger it.

## 🔧 One-Time Setup

### 1. Get Expo Access Token
```bash
# Login to Expo
npx expo login

# Generate token
npx expo whoami
# Then go to: https://expo.dev/accounts/[your-username]/settings/access-tokens
# Click "Create Token" → Name it "GitHub Actions" → Copy the token
```

### 2. Add Token to GitHub Secrets
1. Go to your GitHub repo: `https://github.com/abdulreal96/task-ai`
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `EXPO_TOKEN`
5. Value: Paste your token from step 1
6. Click **Add secret**

---

## 🚀 How to Build APK

### Method 1: Automatic Build (On Push)
Simply push your code to main branch:
```bash
cd frontend
git add .
git commit -m "Trigger APK build"
git push origin main
```

The workflow will automatically start building.

### Method 2: Manual Build
1. Go to: `https://github.com/abdulreal96/task-ai/actions`
2. Click **Build Android APK** workflow
3. Click **Run workflow** button
4. Select branch: `main`
5. Click **Run workflow**

---

## 📦 Download Your APK

1. Go to: `https://github.com/abdulreal96/task-ai/actions`
2. Click on the latest successful workflow run (green checkmark ✓)
3. Scroll down to **Artifacts** section
4. Click **task-ai-app** to download the APK
5. Unzip the downloaded file
6. Install `app-release.apk` on your Android device

---

## 📱 Installing APK on Device

### Option 1: Direct Install
1. Transfer APK to your phone via USB/email/cloud
2. Open the APK file on your phone
3. Allow "Install from Unknown Sources" if prompted
4. Tap **Install**

### Option 2: ADB Install
```bash
# Connect phone via USB with USB Debugging enabled
adb install app-release.apk
```

---

## ⏱️ Build Time
- **First build:** ~8-12 minutes (downloads dependencies)
- **Subsequent builds:** ~5-8 minutes (uses cache)

---

## 🔒 Optional: Sign APK for Production

For Play Store or production releases, you need to sign the APK:

### 1. Generate Signing Key
```bash
keytool -genkeypair -v -keystore task-ai-release.keystore -alias task-ai -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Convert Keystore to Base64
```bash
# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("task-ai-release.keystore")) | Set-Clipboard

# Or use online tool: https://base64.guru/converter/encode/file
```

### 3. Add Signing Secrets to GitHub
Add these secrets in GitHub Settings → Secrets:
- `SIGNING_KEY` - Base64 encoded keystore
- `ALIAS` - Your alias (e.g., "task-ai")
- `KEY_STORE_PASSWORD` - Keystore password
- `KEY_PASSWORD` - Key password

### 4. Uncomment Signing Step
In `.github/workflows/build-android.yml`, uncomment lines 49-56 (the "Sign APK" step)

---

## 🐛 Troubleshooting

**Build fails with "EXPO_TOKEN not found":**
- Make sure you added the secret correctly
- Secret name must be exactly `EXPO_TOKEN` (case-sensitive)

**Build fails at Gradle step:**
- Usually a dependency issue, check the logs
- May need to update `frontend/android/build.gradle`

**APK won't install on device:**
- Enable "Install from Unknown Sources" in Android settings
- For signed APKs, make sure signing was successful

**Build succeeds but no artifact:**
- Check if the APK path is correct in workflow
- Should be: `frontend/android/app/build/outputs/apk/release/app-release.apk`

---

## 📊 Build Status Badge (Optional)

Add this to your README.md to show build status:
```markdown
![Build APK](https://github.com/abdulreal96/task-ai/actions/workflows/build-android.yml/badge.svg)
```

---

## 💰 Cost
**100% FREE** - GitHub Actions provides:
- 2,000 minutes/month for free accounts
- 3,000 minutes/month for Pro accounts
- Each build uses ~8-10 minutes

You can build approximately **200+ APKs per month** for free! 🎉
