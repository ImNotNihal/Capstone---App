# Smart Lock – React Native Mobile App

This repository contains the React Native mobile application for the **Smart Lock** project.
The app is built with **Expo** and communicates with the Smart Lock backend server via REST and WebSocket, and with the lock hardware over Bluetooth Low Energy (BLE).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Install Dependencies](#install-dependencies)
4. [Running the App](#running-the-app)
   - [Expo Go – QR Code (iOS & Android)](#expo-go--qr-code-ios--android)
   - [Web Browser](#web-browser)
   - [iOS Native Build (macOS only)](#ios-native-build-macos-only)
   - [Android Native Build](#android-native-build)
5. [Feature Availability by Platform](#feature-availability-by-platform)
6. [Project Structure](#project-structure)
7. [Notes & Limitations](#notes--limitations)

---

## Prerequisites

Install the following tools before getting started.
All tools listed here work on **Windows, macOS, and Linux**.

| Tool | Version | Notes |
|------|---------|-------|
| [Node.js](https://nodejs.org/) | LTS (22.x recommended) | Use the installer or `nvm` |
| npm | bundled with Node.js | |
| [Expo Go](https://expo.dev/go) | latest | Install on your phone (iOS / Android) |

> **Optional – for native builds only**
>
> | Tool | Platform | Notes |
> |------|----------|-------|
> | Xcode (14+) | macOS only | Required to build for iOS |
> | CocoaPods | macOS only | `sudo gem install cocoapods` |
> | Android Studio | Windows / macOS / Linux | Required to build for Android |
> | Java 17 (JDK) | Windows / macOS / Linux | Required by the Android build toolchain |

---

## Environment Variables

The app reads its backend URL from an environment variable so you can point it at a local server during development or let it fall back to the production cloud server.

1. Copy the example file:

   ```bash
   # Windows (PowerShell)
   Copy-Item .env.example .env

   # macOS / Linux
   cp .env.example .env
   ```

2. Open `.env` and set `EXPO_PUBLIC_API_URL`:

   ```env
   # Leave blank to use the production cloud server (default):
   EXPO_PUBLIC_API_URL=

   # Point to a local backend (replace with your machine's LAN IP):
   EXPO_PUBLIC_API_URL=http://192.168.x.x:8000/
   ```

   > **Finding your LAN IP**
   > - **Windows**: open PowerShell → `ipconfig` → look for `IPv4 Address`
   > - **macOS / Linux**: open Terminal → `ifconfig` or `ip a` → look for `inet` under your Wi-Fi adapter
   >
   > Do **not** use `localhost` or `127.0.0.1` when testing on a physical device – the phone cannot reach your computer's loopback address.

---

## Install Dependencies

```bash
npm install
```

This works identically on Windows, macOS, and Linux.

---

## Running the App

### Expo Go – QR Code (iOS & Android)

This is the recommended way to test on a real phone with zero platform-specific setup.

1. Make sure your phone and your computer are on the **same Wi-Fi network**.

2. Start the Expo development server:

   ```bash
   npx expo start
   ```

   If you are behind a firewall or the QR code connection fails, use the tunnel mode instead:

   ```bash
   npm run start-tunnel
   # or:
   npx expo start --tunnel
   ```

3. A QR code will appear in the terminal.

4. Scan the QR code:
   - **iOS** – open the built-in Camera app and tap the banner that appears.
   - **Android** – open the **Expo Go** app and tap **Scan QR code**.

5. The app will load on your phone automatically.

> **Test login (no server required)**
> Use `email: test` and `password: test` on the Settings screen to log in with a dummy account and explore the app without a running backend.

---

### Web Browser

```bash
npm run web
# or:
npx expo start --web
```

Navigate to `http://localhost:8081` (the port shown in the terminal).

> Note: Bluetooth features are not available in the browser. All other screens (Home, Events, Sensors, Settings) are fully functional.

---

### iOS Native Build (macOS only)

A native build is required for full Bluetooth support and to test Push Notifications.

1. Install iOS CocoaPods dependencies:

   ```bash
   npm run ios:pods
   # equivalent to: cd ios && pod install && cd ..
   ```

2. Open the project in Xcode (macOS only):

   ```bash
   npm run ios:open
   # equivalent to: xed -b ios
   ```

3. In Xcode, select your physical device or a simulator, then press **Run (▶)**.

4. Start the Expo server (if not already running):

   ```bash
   npx expo start
   ```

---

### Android Native Build

A native build is required for full Bluetooth support on Android.

**Prerequisites**: Android Studio installed, an Android emulator configured or a physical Android device connected via USB with USB Debugging enabled.

```bash
npm run android
# or:
npx expo run:android
```

For development builds that include all native modules:

```bash
npx expo run:android --device
```

---

## Feature Availability by Platform

| Feature | Expo Go (iOS) | Expo Go (Android) | Native Build (iOS) | Native Build (Android) | Web |
|---------|:---:|:---:|:---:|:---:|:---:|
| Lock / Unlock (cloud API) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Live camera feed | ✅ | ✅ | ✅ | ✅ | ✅ |
| Real-time status (WebSocket) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Events & activity log | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sensors page | ✅ | ✅ | ✅ | ✅ | ✅ |
| Settings / auth | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bluetooth device config | ❌ | ❌ | ✅ | ✅ | ❌ |

> **Why is Bluetooth unavailable in Expo Go?**
> `react-native-ble-plx` is a native module that Expo Go does not bundle. The BLE code is guarded so it fails silently – the rest of the app works normally. To use Bluetooth, build a development client with `npx expo run:ios` or `npx expo run:android`.

---

## Project Structure

```
src/
├── app/                  # Expo Router route files (thin wrappers)
│   ├── _layout.tsx       # Root layout – wraps providers and Navbar
│   ├── index.tsx         # / → Home page
│   ├── events.tsx        # /events → Activity log
│   ├── sensors.tsx       # /sensors → Sensors & Devices
│   ├── testing.tsx       # /testing → Dev sandbox
│   └── settings/         # /settings/* → Settings sub-pages
├── pages/                # Actual page components (UI logic lives here)
├── components/           # Reusable UI: Navbar, Dialog, Toast
├── context/
│   ├── app-context.tsx   # Auth, lock control, WebSocket, toast
│   └── ble-context.tsx   # BLE state shared app-wide
├── hooks/
│   ├── useBLE.tsx        # BLE scanning, connect, send commands
│   ├── useAppStorage.tsx # Cross-platform persistent storage (AsyncStorage)
│   ├── useSettings.tsx   # Fetch/update device settings from API
│   └── useLocationPermission.tsx
├── config.ts             # Shared runtime config (API_BASE_URL)
└── assets/images/        # PNG icons used throughout the UI
```

---

## Notes & Limitations

- **Same Wi-Fi network**: When testing on a physical device with a local backend, your phone and computer must be on the same network. Use `EXPO_PUBLIC_API_URL` to point at your computer's LAN IP.
- **Bluetooth**: Only available in native builds (`expo run:ios` / `expo run:android`). In Expo Go the BLE screen will show no devices — this is expected.
- **iOS builds on Windows**: Apple does not support building iOS apps on Windows. Use Expo Go for iOS testing from a Windows machine, or use [EAS Build](https://docs.expo.dev/build/introduction/) (cloud build service) to create a development build without a Mac.
- **EAS Build** (cloud): If you need a shareable `.ipa` or `.apk` that includes BLE, run `eas build` instead of a local native build.

---

## Project Context

This mobile app is part of the **Smart Lock** system, which includes:

- A hardware lock device (ESP32 + BLE)
- A backend server (REST API + WebSocket)
- This React Native / Expo mobile client

For backend setup and device firmware details, refer to their respective repositories.
