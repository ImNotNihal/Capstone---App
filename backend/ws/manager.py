"""
WebSocket connection manager.

Two logical channels:
  • Device channel  – one WebSocket per physical ESP32 device
  • Client channel  – many WebSockets from mobile app screens, keyed by
                       the deviceId they subscribed to

Message flow:
  ESP32 → ws/device  → manager.relay_to_clients(deviceId, msg)
                      → all subscribed mobile sessions receive the update

  Mobile → ws/client  → manager.relay_to_device(deviceId, cmd)
                       → connected ESP32 receives the command

Both channels also publish updates to all subscribed clients whenever
the device state changes, so multiple app screens stay in sync.
"""

import asyncio
import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        # deviceId → WebSocket of the ESP32
        self._devices: dict[str, WebSocket] = {}

        # deviceId → set of subscribed client WebSockets
        self._clients: dict[str, set[WebSocket]] = {}

    # ─── Device management ────────────────────────────────────────────────────

    async def connect_device(self, device_id: str, ws: WebSocket) -> None:
        await ws.accept()

        # Disconnect any stale connection for the same device
        old = self._devices.get(device_id)
        if old:
            try:
                await old.close()
            except Exception:
                pass

        self._devices[device_id] = ws
        logger.info("Device connected: %s", device_id)

    def disconnect_device(self, device_id: str) -> None:
        self._devices.pop(device_id, None)
        logger.info("Device disconnected: %s", device_id)

    def device_is_online(self, device_id: str) -> bool:
        return device_id in self._devices

    # ─── Client management ────────────────────────────────────────────────────

    async def connect_client(self, device_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self._clients.setdefault(device_id, set()).add(ws)
        logger.info("Client subscribed to device %s (total: %d)",
                    device_id, len(self._clients[device_id]))

    def disconnect_client(self, device_id: str, ws: WebSocket) -> None:
        subs = self._clients.get(device_id, set())
        subs.discard(ws)
        if not subs:
            self._clients.pop(device_id, None)
        logger.info("Client unsubscribed from device %s", device_id)

    # ─── Relay helpers ────────────────────────────────────────────────────────

    async def relay_to_clients(self, device_id: str, payload: dict[str, Any]) -> int:
        """
        Broadcast a message to every mobile client subscribed to device_id.
        Returns the number of clients that received the message.
        """
        subs = self._clients.get(device_id, set())
        if not subs:
            return 0

        raw = json.dumps(payload)
        dead: set[WebSocket] = set()
        sent = 0

        for ws in list(subs):
            try:
                await ws.send_text(raw)
                sent += 1
            except Exception:
                dead.add(ws)

        for ws in dead:
            subs.discard(ws)

        return sent

    async def relay_to_device(
        self, device_id: str, payload: dict[str, Any]
    ) -> bool:
        """
        Send a command to the ESP32 identified by device_id.
        Returns True if the command was delivered, False if offline.
        """
        ws = self._devices.get(device_id)
        if not ws:
            logger.warning("relay_to_device: device %s not connected", device_id)
            return False

        try:
            await ws.send_text(json.dumps(payload))
            return True
        except Exception as exc:
            logger.error("relay_to_device failed for %s: %s", device_id, exc)
            self.disconnect_device(device_id)
            return False

    async def broadcast_status(self, device_id: str, status: str) -> None:
        """Convenience wrapper: push a lock-state update to all app clients."""
        await self.relay_to_clients(device_id, {
            "type": "status",
            "deviceId": device_id,
            "status": status,
        })

    # ─── Stats ────────────────────────────────────────────────────────────────

    def stats(self) -> dict:
        return {
            "devices_online": list(self._devices.keys()),
            "client_subscriptions": {k: len(v) for k, v in self._clients.items()},
        }


# Singleton shared across all routers and WebSocket handlers
manager = ConnectionManager()
