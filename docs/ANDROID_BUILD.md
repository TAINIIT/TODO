# Android Build Guide

## Prerequisites

- **Android Studio** (latest version)
- **Node.js** 18+
- **Java JDK** 17+

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build and Initialize Android Project

```bash
npm run build:android
```

This creates the `android/` folder with the Android project.

### 3. Open in Android Studio

```bash
npm run open:android
```

## Development Workflow

### Make Changes

1. Edit code in `src/`
2. Run `npm run build:android` to sync changes
3. Build/run in Android Studio

### Quick Sync (no rebuild)

```bash
npm run sync
```

## Android Studio Configuration

### SDK Setup

1. Open SDK Manager (Tools → SDK Manager)
2. Install Android API 34 (or latest)
3. Install Android Build Tools

### Signing Configuration

For release builds, create `android/app/keystore.properties`:

```properties
storeFile=my-release-key.keystore
storePassword=******
keyAlias=my-key-alias
keyPassword=******
```

### App Icons

Place icons in: `android/app/src/main/res/`

- `mipmap-mdpi/` - 48x48
- `mipmap-hdpi/` - 72x72
- `mipmap-xhdpi/` - 96x96
- `mipmap-xxhdpi/` - 144x144
- `mipmap-xxxhdpi/` - 192x192

### Adaptive Icons

Edit: `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`

### Splash Screen

Configure in: `android/app/src/main/res/values/styles.xml`

## Build Commands

### Debug Build

```bash
cd android
./gradlew assembleDebug
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release Build

```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

### AAB for Play Store

```bash
cd android
./gradlew bundleRelease
```

## Deep Links

Configure in: `android/app/src/main/AndroidManifest.xml`

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="taskflow" />
</intent-filter>
```

## Troubleshooting

### Gradle Sync Failed

```bash
cd android
./gradlew --refresh-dependencies
```

### Clear Build Cache

```bash
cd android
./gradlew clean
```

### SDK Not Found

Set `ANDROID_HOME` environment variable to your SDK location.

## App Info

| Property | Value |
|----------|-------|
| App Name | TaskFlow |
| Package Name | com.tsb.taskflow |
| Min SDK | 22 (Android 5.1) |
| Target SDK | 34 (Android 14) |
| URL Scheme | taskflow:// |
