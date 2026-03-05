# Smart Lock – React Native Mobile App

This repository contains the React Native mobile application for the **Smart Lock** project.  
The app is built with **Expo** and is responsible for interacting with the Smart Lock backend and device (for example authentication, device control, and Bluetooth features).

---

## Prerequisites

Before getting started, make sure you have the following installed:

- Node.js (LTS recommended)
- npm
- Expo CLI (via `npx`, no global install required)
- Xcode (for iOS development)
- CocoaPods (for iOS native dependencies)

---

## Getting Started

### 1. Install dependencies

From the project root, run:

```bash
npm install
````

---

### 2. Configure environment variables (optional but recommended)

If you are running the backend server locally, create a `.env` file at the root of the project with the following variable:

```env
EXPO_PUBLIC_API_URL="http://<your-computer-ip>:8000"
```

Notes:

* Replace `<your-computer-ip>` with your local network IP (not `localhost`).
* This is required for testing the app on a physical device.

---

### 3. Start the Expo development server

```bash
npx expo start --tunnel
```

This will open the Expo developer tools and display a QR code.

---

## Running the App

### Run in the Browser

You can access the app in a web browser at:

```
http://localhost:8081
```

Notes:

* The exact port may vary.
* Some features will **not** work in the browser, especially Bluetooth-related functionality.

---

### Run on iPhone (macOS only – tested setup)

This setup has been tested with **iPhone + macOS**.
iPhone + Windows has not been tested.

#### iOS native setup

1. Install iOS dependencies:

   ```bash
   cd ios
   pod install
   cd ..
   ```

2. Open the iOS project in Xcode:

   ```bash
   xed -b ios
   ```

3. Start the Expo server (if not already running):

   ```bash
   npx expo start --tunnel
   ```
   (--tunnel is required sometimes when app doesnt start on ios)

4. Scan the QR code using your iPhone camera.

    * The app should open directly on your device.

For a complete walkthrough, see this video:
[https://www.youtube.com/watch?v=daghwzIuiA0](https://www.youtube.com/watch?v=daghwzIuiA0)

---

### Run on Android

This setup has not yet been tested.

If you successfully run the app on Android:

* Please add the steps here.
* A short video or emulator setup guide would be helpful.

---

## Notes & Limitations

* Bluetooth functionality only works on physical devices.
* Ensure your phone and computer are on the same local network when using a local backend.
* If the app cannot reach the backend, double-check the `EXPO_PUBLIC_API_URL` value.

---

## Project Context

This mobile app is part of the **Smart Lock** system, which includes:

* A hardware lock device
* A backend server (API + WebSocket)
* This React Native mobile client

For backend setup and device firmware details, refer to their respective repositories.

---

