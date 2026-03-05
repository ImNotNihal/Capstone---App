"""
WebSocket endpoint for mobile app clients.

Connection lifecycle:
  1. App connects to   ws://<server>/ws/client
  2. App sends:        {"type": "subscribe", "deviceId": "smartlock_XXXX"}
  3. Server registers the subscription
  4. Server immediately pushes current lock status
  5. Any future status / event messages from the device are forwarded here
  6. App may send commands:
       {"type": "command", "deviceId": "...", "command": "LOCK" | "UNLOCK"}
  7. On disconnect the subscription is cleaned up
"""

import json
import logging

from fastapi import WebSocket, WebSocketDisconnect

from services.device_service import get_device_status, set_lock_status
from services.event_service import log_event
from ws.manager import manager

logger = logging.getLogger(__name__)


async def client_ws_endpoint(websocket: WebSocket) -> None:
    device_id: str | None = None

    try:
        await websocket.accept()

        # Wait for the subscribe frame
        raw = await websocket.receive_text()
        data = json.loads(raw)

        if data.get("type") != "subscribe" or not data.get("deviceId"):
            await websocket.close(code=1008, reason="Expected subscribe frame")
            return

        device_id = data["deviceId"]

        # Register this client socket under the requested deviceId
        manager._clients.setdefault(device_id, set()).add(websocket)
        logger.info("Client subscribed to %s", device_id)

        # Push current status immediately so the UI doesn't wait for the next event
        current = get_device_status(device_id)
        await websocket.send_text(json.dumps({
            "type": "status",
            "deviceId": device_id,
            "status": current.get("status", "UNKNOWN"),
            "isOnline": current.get("isOnline", False),
        }))

        # ── Main receive loop ──────────────────────────────────────────────
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = msg.get("type")

            # ── Command (mobile → ESP32) ───────────────────────────────────
            if msg_type == "command":
                command = msg.get("command", "").upper()
                if command not in ("LOCK", "UNLOCK"):
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Invalid command. Use LOCK or UNLOCK.",
                    }))
                    continue

                relayed = await manager.relay_to_device(device_id, {
                    "type": "command",
                    "command": command,
                })

                await websocket.send_text(json.dumps({
                    "type": "command_ack",
                    "command": command,
                    "relayed": relayed,
                }))

                if not relayed:
                    # Device offline: optimistically update status and log event
                    status = "LOCKED" if command == "LOCK" else "UNLOCKED"
                    set_lock_status(device_id, status)
                    await manager.broadcast_status(device_id, status)
                    await log_event(device_id, status)

            # ── Ping ─────────────────────────────────────────────────────
            elif msg_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        logger.info("Client disconnected from device %s", device_id)
    except Exception as exc:
        logger.error("Client WS error: %s", exc)
    finally:
        if device_id and websocket in manager._clients.get(device_id, set()):
            manager._clients[device_id].discard(websocket)
            if not manager._clients.get(device_id):
                manager._clients.pop(device_id, None)
