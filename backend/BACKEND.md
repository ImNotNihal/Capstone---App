# Smart Door Lock – Backend Reference

## Quick Start

```bash
cd backend

# 1. Create virtualenv
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# edit .env – set JWT_SECRET_KEY and FIREBASE_SERVICE_ACCOUNT_PATH

# 4. Run dev server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Interactive API docs: http://localhost:8000/docs

---

## Architecture

```
main.py
  ├── routers/auth.py          POST /auth/register|login|refresh  GET /auth/me
  ├── routers/devices.py       POST /devices/{id}/lock|unlock      GET /devices/{id}/status
  │                            POST /send-command/{id}/{cmd}       GET /status/{id}
  ├── routers/events.py        GET /devices/{id}/events            GET /users/{uid}/alerts
  ├── routers/settings.py      GET|PUT /settings/{device_id}
  ├── routers/credentials.py   GET|POST /credentials/me[/enroll|/revoke]
  ├── routers/media.py         POST /media/upload                  GET /media/{device_id}
  │
  ├── ws/device_ws.py          ws://<host>/ws/device   ← ESP32 connects here
  ├── ws/client_ws.py          ws://<host>/ws/client   ← Mobile app connects here
  └── ws/manager.py            Shared ConnectionManager singleton
```

---

## Firestore Collections

### `users/{uid}`
```json
{
  "email": "user@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "hashedPassword": "<bcrypt>",
  "deviceId": "smartlock_D0DB64A84320",
  "deviceIds": ["smartlock_D0DB64A84320"],
  "fcmToken": "<Firebase Cloud Messaging token>",
  "role": "owner",
  "createdAt": "<timestamp>"
}
```

### `devices/{deviceId}`
```json
{
  "name": "Front Door",
  "status": "LOCKED",
  "isOnline": true,
  "ownerId": "<uid>",
  "lastSeen": "<timestamp>",
  "firmwareVersion": "1.2.0",
  "createdAt": "<timestamp>"
}
```

### `credentials/{credentialId}`
```json
{
  "userId": "<uid>",
  "deviceId": "smartlock_D0DB64A84320",
  "method": "fingerprint",
  "isActive": true,
  "enrolledAt": "<timestamp>",
  "data": {}
}
```
`method` ∈ `{ face | fingerprint | keypad | bluetooth }`

### `events/{eventId}`
```json
{
  "deviceId": "smartlock_D0DB64A84320",
  "userId": "<uid or null>",
  "type": "UNLOCKED",
  "timestamp": "<timestamp>",
  "metadata": {},
  "acknowledged": false
}
```

Event types:
`LOCKED` · `UNLOCKED` · `DOOR_OPENED` · `DOOR_CLOSED` · `MOTION_DETECTED`
`FACE_RECOGNIZED` · `FACE_UNKNOWN` · `FINGERPRINT_SUCCESS` · `FINGERPRINT_FAILED`
`KEYPAD_SUCCESS` · `KEYPAD_FAILED` · `AUTH_FAILED` · `CAMERA_TRIGGERED`

### `alerts/{alertId}`
```json
{
  "userId": "<uid>",
  "deviceId": "smartlock_D0DB64A84320",
  "type": "MOTION_DETECTED",
  "message": "Motion detected near the door.",
  "read": false,
  "timestamp": "<timestamp>",
  "severity": "warning",
  "eventId": "<events doc id>"
}
```
`severity` ∈ `{ info | warning | danger }`

### `camera_recordings/{recordingId}`
```json
{
  "deviceId": "smartlock_D0DB64A84320",
  "uploadedBy": "<uid>",
  "eventType": "CAMERA_TRIGGERED",
  "timestamp": "<timestamp>",
  "mediaUrl": "https://storage.googleapis.com/...",
  "filename": "<uuid>.mp4",
  "duration": 15,
  "thumbnail": null
}
```

### `settings/{deviceId}`
```json
{
  "autoLock": true,
  "autoLockTimeout": 30,
  "failedAttemptLimit": 5,
  "alertsEnabled": true,
  "motionSensitivity": "medium",
  "cameraEnabled": true,
  "updatedAt": "<timestamp>"
}
```

---

## Required Firestore Indexes

Create these composite indexes in the Firebase Console
(Firestore → Indexes → Composite):

| Collection         | Fields                                      | Order |
|--------------------|---------------------------------------------|-------|
| `events`           | `deviceId` ASC, `timestamp` DESC            |       |
| `alerts`           | `userId` ASC, `timestamp` DESC              |       |
| `camera_recordings`| `deviceId` ASC, `timestamp` DESC            |       |
| `credentials`      | `userId` ASC, `deviceId` ASC, `method` ASC  |       |

---

## WebSocket Protocol

### Device Channel — `ws://<host>/ws/device`

The ESP32 connects once and keeps the connection alive.

**Step 1 – Register**
```json
// ESP32 → Server
{"type": "hello", "deviceId": "smartlock_D0DB64A84320"}

// Server → ESP32
{"type": "ack", "deviceId": "smartlock_D0DB64A84320", "message": "registered"}
```

**Step 2 – Send status updates**
```json
// ESP32 → Server (any time lock state changes)
{"type": "status", "deviceId": "smartlock_D0DB64A84320", "status": "LOCKED"}
{"type": "status", "deviceId": "smartlock_D0DB64A84320", "status": "UNLOCKED"}
```

**Step 3 – Send sensor events**
```json
{"type": "event", "deviceId": "smartlock_D0DB64A84320",
 "eventType": "MOTION_DETECTED", "metadata": {"zone": "front"}}
```

**Step 4 – Receive commands**
```json
// Server → ESP32
{"type": "command", "command": "LOCK"}
{"type": "command", "command": "UNLOCK"}
```

**Heartbeat**
```json
{"type": "ping"}   // ESP32 → Server
{"type": "pong"}   // Server → ESP32
```

---

### Client Channel — `ws://<host>/ws/client`

**Step 1 – Subscribe**
```json
// App → Server
{"type": "subscribe", "deviceId": "smartlock_D0DB64A84320"}

// Server → App (immediate snapshot)
{"type": "status", "deviceId": "...", "status": "LOCKED", "isOnline": true}
```

**Step 2 – Receive real-time updates**
```json
{"type": "status",  "deviceId": "...", "status": "UNLOCKED"}
{"type": "event",   "deviceId": "...", "eventType": "MOTION_DETECTED", "metadata": {}}
{"type": "status",  "deviceId": "...", "status": "CONNECTED"}    // device came online
{"type": "status",  "deviceId": "...", "status": "DISCONNECTED"} // device went offline
```

**Step 3 – Send commands (optional; REST is preferred)**
```json
{"type": "command", "deviceId": "...", "command": "UNLOCK"}

// Server → App
{"type": "command_ack", "command": "UNLOCK", "relayed": true}
```

---

## ESP32 Arduino Integration Example

```cpp
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

const char* SSID     = "YourWiFi";
const char* PASSWORD = "YourPassword";
const char* WS_HOST  = "your-server.com";
const int   WS_PORT  = 8000;
const char* DEVICE_ID = "smartlock_D0DB64A84320";

WebSocketsClient ws;
bool registered = false;

void onWsEvent(WStype_t type, uint8_t* payload, size_t length) {
    if (type == WStype_TEXT) {
        StaticJsonDocument<256> doc;
        deserializeJson(doc, payload, length);
        const char* msgType = doc["type"];

        if (strcmp(msgType, "ack") == 0) {
            registered = true;
            Serial.println("Registered with server");

        } else if (strcmp(msgType, "command") == 0) {
            const char* cmd = doc["command"];
            if (strcmp(cmd, "LOCK") == 0) {
                actuateLock(true);
                sendStatus("LOCKED");
            } else if (strcmp(cmd, "UNLOCK") == 0) {
                actuateLock(false);
                sendStatus("UNLOCKED");
            }
        }
    }
}

void sendStatus(const char* status) {
    StaticJsonDocument<128> doc;
    doc["type"]     = "status";
    doc["deviceId"] = DEVICE_ID;
    doc["status"]   = status;
    String msg;
    serializeJson(doc, msg);
    ws.sendTXT(msg);
}

void sendEvent(const char* eventType) {
    StaticJsonDocument<128> doc;
    doc["type"]      = "event";
    doc["deviceId"]  = DEVICE_ID;
    doc["eventType"] = eventType;
    String msg;
    serializeJson(doc, msg);
    ws.sendTXT(msg);
}

void actuateLock(bool locked) {
    // Drive servo or relay here
    // servo.write(locked ? 90 : 0);
}

void setup() {
    Serial.begin(115200);
    WiFi.begin(SSID, PASSWORD);
    while (WiFi.status() != WL_CONNECTED) delay(500);

    ws.begin(WS_HOST, WS_PORT, "/ws/device");
    ws.onEvent(onWsEvent);

    // Send hello frame on connect
    ws.setReconnectInterval(5000);
}

void loop() {
    ws.loop();

    // Send hello if newly connected but not yet registered
    if (ws.isConnected() && !registered) {
        StaticJsonDocument<128> doc;
        doc["type"]     = "hello";
        doc["deviceId"] = DEVICE_ID;
        String msg;
        serializeJson(doc, msg);
        ws.sendTXT(msg);
    }
}
```

---

## Mobile App API Examples

### Sign in
```typescript
const res = await fetch(`${API_BASE_URL}auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const { access_token, refresh_token } = await res.json();
```

### Lock / Unlock
```typescript
const res = await fetch(`${API_BASE_URL}send-command/${deviceId}/UNLOCK`, {
  method: "POST",
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

### Connect WebSocket
```typescript
const ws = new WebSocket(`wss://your-server.com/ws/client`);
ws.onopen = () => {
  ws.send(JSON.stringify({ type: "subscribe", deviceId }));
};
ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.type === "status") setIsLocked(data.status === "LOCKED");
};
```

---

## Deployment (Cloud Run)

```bash
# Build
docker build -t smart-lock-backend .

# Tag and push to Google Artifact Registry
docker tag smart-lock-backend gcr.io/<project-id>/smart-lock-backend
docker push gcr.io/<project-id>/smart-lock-backend

# Deploy (Cloud Run supports WebSockets via --session-affinity)
gcloud run deploy smart-lock-backend \
  --image gcr.io/<project-id>/smart-lock-backend \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --session-affinity \
  --set-env-vars JWT_SECRET_KEY=<secret>,FIREBASE_SERVICE_ACCOUNT_PATH=/secrets/sa.json
```

> **WebSockets on Cloud Run**: enable `--session-affinity` so that each
> device/client WebSocket sticks to the same instance. For multi-instance
> deployments replace the in-memory `ConnectionManager` with a Redis
> pub/sub backend.
