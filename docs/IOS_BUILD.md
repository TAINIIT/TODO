# iOS Build Guide

## Prerequisites

- **macOS** with Xcode 15+ installed
- **Node.js** 18+
- **CocoaPods** (`sudo gem install cocoapods`)

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build and Initialize iOS Project

```bash
npm run build:ios
```

This creates the `ios/` folder with the Xcode project.

### 3. Open in Xcode

```bash
npm run open:ios
```

## Development Workflow

### Make Changes

1. Edit code in `src/`
2. Run `npm run build:ios` to sync changes
3. Build/run in Xcode

### Quick Sync (no rebuild)

```bash
npm run sync
```

## Xcode Configuration

### Signing & Capabilities

1. Open Xcode → Select project → Signing & Capabilities
2. Select your Team
3. Change Bundle Identifier to: `com.tsb.taskflow`

### iOS Deployment Target

- Minimum: iOS 14.0
- Recommended: iOS 15.0+

### Deep Links (URL Scheme)

The app is configured with URL scheme: `taskflow://`

### App Icons

Place icons in: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

Required sizes:

- 1024x1024 (App Store)
- 180x180 (@3x iPhone)
- 120x120 (@2x iPhone)
- 167x167 (iPad Pro)
- 152x152 (@2x iPad)
- 76x76 (@1x iPad)

### Splash Screen

Edit: `ios/App/App/Assets.xcassets/Splash.imageset/`

## Build for TestFlight

1. In Xcode: Product → Archive
2. Distribute App → App Store Connect
3. Upload to TestFlight

## Troubleshooting

### Pod Install Failed

```bash
cd ios/App
pod install --repo-update
```

### Capacitor Not Found

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init
```

### Build Errors

1. Clean build folder: Cmd+Shift+K
2. Delete `ios/` and run `npm run build:ios`

## App Info

| Property | Value |
|----------|-------|
| App Name | TaskFlow |
| Bundle ID | com.tsb.taskflow |
| URL Scheme | taskflow:// |
| Min iOS | 14.0 |
