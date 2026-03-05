"""
WebSocket endpoint for ESP32 devices.

Connection lifecycle:
  1. ESP32 connects to  ws://<server>/ws/device
  2. ESP32 sends:       {"type": "hello", "deviceId": "smartlock_XXXX"}
  3. Server registers the device and marks it online in Firestore
  4. ESP32 sends periodic status frames:
       {"type": "status",  "deviceId": "...", "status": "LOCKED"}
       {"type": "event",   "deviceId": "...", "eventType": "MOTION_DETECTED", "metadata": {...}}
  5. Server relays status to all subscribed app clients
  6. Server sends commands to the ESP32:
       {"type": "command", "command": "LOCK" | "UNLOCK"}
  7. On disconnect the device is marked offline
"""

import json
import logging

from fastapi import WebSocket, WebSocketDisconnect

from services.device_service import mark_device_online, set_lock_status
from services.event_service import log_event
from ws.manager import manager

logger = logging.getLogger(__name__)

# Valid event types accepted from the device
_DEVICE_EVENT_TYPES = {
    "MOTION_DETECTED",
    "FACE_RECOGNIZED",
    "FACE_UNKNOWN",
    "FINGERPRINT_SUCCESS",
    "FINGERPRINT_FAILED",
    "KEYPAD_SUCCESS",
    "KEYPAD_FAILED",
    "DOOR_OPENED",
    "DOOR_CLOSED",
    "CAMERA_TRIGGERED",
    "AUTH_FAILED",
}


async def device_ws_endpoint(websocket: WebSocket) -> None:
    device_id: str | None = None

    try:
        # Wait for the hello frame to learn the device id before registering
        await websocket.accept()
        raw = await websocket.receive_text()
        data = json.loads(raw)

        if data.get("type") != "hello" or not data.get("deviceId"):
            await websocket.close(code=1008, reason="Expected hello frame")
            return

        device_id = data["deviceId"]

        # Register — replaces any stale connection (accept already done above)
        old = manager._devices.get(device_id)
        if old:
            try:
                await old.close()
            except Exception:
                pass
        manager._devices[device_id] = websocket

        mark_device_online(device_id, True)
        await manager.broadcast_status(device_id, "CONNECTED")
        logger.info("ESP32 registered: %s", device_id)

        # Send acknowledgement
        await websocket.send_text(
            json.dumps({"type": "ack", "deviceId": device_id, "message": "registered"})
        )

        # ── Main receive loop ──────────────────────────────────────────────
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                logger.warning("Device %s sent invalid JSON", device_id)
                continue

            msg_type = msg.get("type")

            # ── Status update (LOCKED / UNLOCKED) ─────────────────────────
            if msg_type == "status":
                status = msg.get("status", "UNKNOWN").upper()
                set_lock_status(device_id, status)
                await manager.broadcast_status(device_id, status)

                if status in ("LOCKED", "UNLOCKED"):
                    await log_event(device_id, status)

            # ── Sensor / security events ──────────────────────────────────
            elif msg_type == "event":
                event_type = msg.get("eventType", "").upper()
                if event_type not in _DEVICE_EVENT_TYPES:
                    logger.warning("Unknown event type from device: %s", event_type)
                    continue

                metadata = msg.get("metadata", {})
                await log_event(device_id, event_type, metadata=metadata)

                # Forward the event to subscribed app clients
                await manager.relay_to_clients(device_id, {
                    "type": "event",
                    "deviceId": device_id,
                    "eventType": event_type,
                    "metadata": metadata,
                })

            # ── Heartbeat / ping ──────────────────────────────────────────
            elif msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

            else:
                logger.debug("Unhandled device message type: %s", msg_type)

    except WebSocketDisconnect:
        logger.info("Device disconnected: %s", device_id)
    except Exception as exc:
        logger.error("Device WS error (%s): %s", device_id, exc)
    finally:
        if device_id:
            manager.disconnect_device(device_id)
            mark_device_online(device_id, False)
            await manager.broadcast_status(device_id, "DISCONNECTED")
