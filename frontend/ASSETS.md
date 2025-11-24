# Assets Setup for Task AI Manager Frontend

## Required Assets

The following assets need to be placed in the `frontend/assets/` directory:

### App Icon
- **File**: `icon.png`
- **Size**: 1024x1024 px
- **Format**: PNG
- **Purpose**: App icon for iOS and Android

### Splash Screen
- **File**: `splash.png`
- **Size**: 2048x2732 px (recommended)
- **Format**: PNG
- **Purpose**: Launch screen shown while app loads

### Adaptive Icon (Android)
- **File**: `adaptive-icon.png`
- **Size**: 1024x1024 px
- **Format**: PNG
- **Purpose**: Adaptive icon for Android devices

## Placeholder Assets

Until custom assets are created, you can use:

### Simple Placeholder Icon
Create a simple colored square with app initials:
- Background: #6366f1 (Indigo)
- Text: "TAI" (Task AI) in white
- Font: Bold, centered

### Simple Placeholder Splash
- Background: #ffffff (White)
- Center logo/text with app name
- Bottom: Loading indicator or version number

## Asset Directory Structure

```
frontend/assets/
├── icon.png              # 1024x1024 app icon
├── splash.png            # 2048x2732 splash screen
├── adaptive-icon.png     # 1024x1024 Android adaptive icon
└── favicon.png          # 32x32 web favicon (optional)
```

## Creating Assets

### Option 1: Design Tools
- Use Figma, Adobe XD, or Sketch
- Export at required dimensions
- Save as PNG with transparency (where applicable)

### Option 2: Online Generators
- Use app icon generators online
- Upload a base design
- Download all required sizes

### Option 3: Temporary Placeholder
For development, you can use placeholder images:
```bash
# Create placeholder files (temporary)
# Use any image editing tool to create simple colored squares
```

## Updating app.json

After adding assets, ensure `app.json` references them correctly:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
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

## Testing Assets

1. Add assets to `frontend/assets/` directory
2. Clear Expo cache: `npx expo start --clear`
3. Restart the app
4. Check splash screen on app launch
5. Verify app icon in device home screen

## Notes

- Assets are currently missing from the project
- The app will run without them but may show default Expo branding
- Add custom assets before production build
- Test assets on both iOS and Android devices
- Ensure icon is readable at small sizes

## Design Guidelines

### Icon Design
- Keep it simple and recognizable
- Use app brand colors
- Ensure it works on both light and dark backgrounds
- Test at small sizes (e.g., 40x40 px)

### Splash Screen
- Use minimal design
- Include brand identity
- Keep loading time considerations in mind
- Test on various screen sizes

## Future Enhancements

- Add app screenshots for store listings
- Create promotional graphics
- Design feature graphics for Play Store
- Create Apple Watch icon (if applicable)
- Add dark mode variants
