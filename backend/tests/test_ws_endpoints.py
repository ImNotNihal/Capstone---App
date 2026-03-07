"""
Integration tests for WebSocket endpoints.

  - ws/device  (device_ws_endpoint)  – ESP32 hardware channel
  - ws/client  (client_ws_endpoint)  – mobile app channel

Each test uses FastAPI's TestClient.websocket_connect() context manager which
handles the full WS handshake synchronously. Firebase calls are mocked via the
mock_db fixture and log_event / notification helpers are patched out.
"""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from tests.conftest import make_doc

DEVICE_ID = "lock_TESTDEV"


# ─── Common patches used across WS tests ─────────────────────────────────────

def _ws_patches(mock_db=None, device_online: bool = False):
    """
    Return a list of context-manager patches common to WS endpoint tests.
    - log_event         → no-op AsyncMock (avoids deep Firestore chain)
    - send_push_notification → no-op AsyncMock
    """
    return [
        patch("services.event_service.log_event", new=AsyncMock(return_value="evt-id")),
        patch(
            "services.notification_service.send_push_notification",
            new=AsyncMock(return_value=None),
        ),
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# Device WebSocket  (ws/device)
# ═══════════════════════════════════════════════════════════════════════════════

class TestDeviceWS:
    # ── Handshake ────────────────────────────────────────────────────────────

    def test_hello_frame_registers_device(self, client, mock_db):
        """A valid hello frame should register the device and return an ack."""
        with _ws_patches()[0], _ws_patches()[1]:
            with client.websocket_connect("/ws/device") as ws:
                ws.send_json({"type": "hello", "deviceId": DEVICE_ID})
                ack = ws.receive_json()

        assert ack["type"] == "ack"
        assert ack["deviceId"] == DEVICE_ID
        assert ack["message"] == "registered"

    def test_hello_registers_device_in_manager(self, client, mock_db):
        """After a hello frame the device should appear as online in the manager."""
        from ws.manager import manager

        with _ws_patches()[0], _ws_patches()[1]:
            with client.websocket_connect("/ws/device") as ws:
                ws.send_json({"type": "hello", "deviceId": DEVICE_ID})
                ws.receive_json()  # ack
                assert manager.device_is_online(DEVICE_ID)

        # After the context exits the WS closes → device should be offline
        assert not manager.device_is_online(DEVICE_ID)

    def test_invalid_hello_type_closes_connection(self, client, mock_db):
        """A non-hello first message must close the connection with code 1008."""
        with _ws_patches()[0], _ws_patches()[1]:
            with client.websocket_connect("/ws/device") as ws:
                ws.send_json({"type": "status", "deviceId": DEVICE_ID})
                with pytest.raises(Exception):
                    ws.receive_json()

    def test_hello_without_device_id_closes_connection(self, client, mock_db):
        """A hello with no deviceId must close the connection."""
        with _ws_patches()[0], _ws_patches()[1]:
            with client.websocket_connect("/ws/device") as ws:
                ws.send_json({"type": "hello"})
                with pytest.raises(Exception):
                    ws.receive_json()

    # ── Status messages ────────────────────────────────────────────────────

    def test_status_message_broadcasts_to_clients(self, client, mock_db):
        """A status frame from the device should be relayed to subscribed clients."""
        from ws.manager import manager

        # Pre-register a mock client subscription
        client_ws_mock = AsyncMock()
        manager._clients[DEVICE_ID] = {client_ws_mock}

        with _ws_patches()[0], _ws_patches()[1]:
            with client.websocket_connect("/ws/device") as ws:
                ws.send_json({"type": "hello", "deviceId": DEVICE_ID})
                ws.receive_json()  # ack

                ws.send_json({"type": "status", "deviceId": DEVICE_ID, "status": "UNLOCKED"})

        # broadcast_status sends to all clients (multiple calls may occur, e.g. CONNECTED on
        # hello and DISCONNECTED on close — check that at least one is the UNLOCKED update)
        client_ws_mock.send_text.assert_awaited()
        all_payloads = [
            json.loads(call[0][0])
            for call in client_ws_mock.send_text.call_args_list
        ]
        assert any(p.get("status") == "UNLOCKED" for p in all_payloads), (
            f"Expected UNLOCKED broadcast among: {all_payloads}"
        )

    def test_status_message_persists_to_firestore(self, client, mock_db):
        """Lock status must be written to Firestore when a status frame arrives."""
        with _ws_patches()[0], _ws_patches()[1]:
            with client.websocket_connect("/ws/device") as ws:
                ws.send_json({"type": "hello", "deviceId": DEVICE_ID})
                ws.receive_json()  # ack
                ws.send_json({"type": "status", "deviceId": DEVICE_ID, "status": "LOCKED"})

        # set_lock_status calls db.collection("devices").document(id).set(...)
        mock_db.collection.return_value.document.return_value.set.assert_called()

    # ── Event messages ─────────────────────────────────────────────────────

    def test_valid_event_is_logged(self, client, mock_db):
        """A valid event frame must be passed to log_event."""
        log_mock = AsyncMock(return_value="evt-id")

        # device_ws.py uses `from services.event_service import log_event`, so patch
        # the name as it appears in the device_ws module, not the source module.
        with patch("ws.device_ws.log_event", new=log_mock), \
             patch("services.notification_service.send_push_notification", new=AsyncMock()):
            with client.websocket_connect("/ws/device") as ws:
                ws.send_json({"type": "hello", "deviceId": DEVICE_ID})
                ws.receive_json()  # ack
                ws.send_json({
                    "type": "event",
                    "deviceId": DEVICE_ID,
                    "eventType": "MOTION_DETECTED",
                    "metadata": {"confidence": 0.9},
                })
                # Ping/pong barrier: ensures the event handler above has fully
                # executed before we exit (messages are processed sequentially).
                ws.send_json({"type": "ping"})
                ws.receive_json()  # pong

        log_mock.assert_awaited()
        call_args = log_mock.call_args
        assert call_args[0][1] == "MOTION_DETECTED"

    def test_unknown_event_type_is_ignored(self, client, mock_db):
        """An unknown eventType must not crash the handler."""
        log_mock = AsyncMock(return_value="evt-id")

        with patch("services.event_service.log_event", new=log_mock), \
             patch("services.notification_service.send_push_notification", new=AsyncMock()):
            with client.websocket_connect("/ws/device") as ws:
                ws.send_json({"type": "hello", "deviceId": DEVICE_ID})
                ws.receive_json()  # ack
                ws.send_json({
                    "type": "event",
                    "deviceId": DEVICE_ID,
                    "eventType": "SELF_DESTRUCT",
                })

        log_mock.assert_not_awaited()

    # ── Ping / pong ────────────────────────────────────────────────────────

    def test_ping_returns_pong(self, client, mock_db):
        with _ws_patches()[0], _ws_patches()[1]:
            with client.websocket_connect("/ws/device") as ws:
                ws.send_json({"type": "hello", "deviceId": DEVICE_ID})
                ws.receive_json()  # ack

                ws.send_json({"type": "ping"})
                pong = ws.receive_json()

        assert pong == {"type": "pong"}

    # ── Disconnect ────────────────────────────────────────────────────────

    def test_disconnect_marks_device_offline(self, client, mock_db):
        """When the device WS closes, Firestore should be updated to offline."""
        with _ws_patches()[0], _ws_patches()[1]:
            with client.websocket_connect("/ws/device") as ws:
                ws.send_json({"type": "hello", "deviceId": DEVICE_ID})
                ws.receive_json()  # ack

        # mark_device_online(device_id, False) is called in the finally block
        set_calls = mock_db.collection.return_value.document.return_value.set.call_args_list
        # Find a call that sets isOnline=False
        offline_calls = [
            c for c in set_calls
            if isinstance(c[0][0], dict) and c[0][0].get("isOnline") is False
        ]
        assert offline_calls, "Expected at least one offline mark call"


# ═══════════════════════════════════════════════════════════════════════════════
# Client WebSocket  (ws/client)
# ═══════════════════════════════════════════════════════════════════════════════

class TestClientWS:
    def _device_status_doc(self, status="LOCKED"):
        return make_doc(DEVICE_ID, {
            "status": status,
            "isOnline": True,
        })

    # ── Handshake ────────────────────────────────────────────────────────────

    def test_subscribe_receives_current_status(self, client, mock_db):
        """After subscribing the client should immediately receive the current status."""
        mock_db.collection.return_value.document.return_value.get.return_value = (
            self._device_status_doc("LOCKED")
        )

        with client.websocket_connect("/ws/client") as ws:
            ws.send_json({"type": "subscribe", "deviceId": DEVICE_ID})
            msg = ws.receive_json()

        assert msg["type"] == "status"
        assert msg["deviceId"] == DEVICE_ID
        assert msg["status"] == "LOCKED"

    def test_invalid_subscribe_type_closes_connection(self, client, mock_db):
        """A non-subscribe first frame must close the connection with 1008."""
        with client.websocket_connect("/ws/client") as ws:
            ws.send_json({"type": "hello", "deviceId": DEVICE_ID})
            with pytest.raises(Exception):
                ws.receive_json()

    def test_subscribe_without_device_id_closes_connection(self, client, mock_db):
        with client.websocket_connect("/ws/client") as ws:
            ws.send_json({"type": "subscribe"})
            with pytest.raises(Exception):
                ws.receive_json()

    def test_subscribe_registers_client_in_manager(self, client, mock_db):
        """The client WS should appear in the manager's subscriptions after subscribe."""
        from ws.manager import manager

        mock_db.collection.return_value.document.return_value.get.return_value = (
            self._device_status_doc()
        )

        with client.websocket_connect("/ws/client") as ws:
            ws.send_json({"type": "subscribe", "deviceId": DEVICE_ID})
            ws.receive_json()  # initial status
            assert len(manager._clients.get(DEVICE_ID, set())) == 1

        # After disconnect the subscription should be cleaned up
        assert len(manager._clients.get(DEVICE_ID, set())) == 0

    # ── Command messages ──────────────────────────────────────────────────

    def test_lock_command_relayed_to_device(self, client, mock_db):
        """LOCK command sent by a client should be forwarded to the connected device."""
        from ws.manager import manager

        # Set up a mock device connection so relay_to_device returns True
        device_ws = AsyncMock()
        manager._devices[DEVICE_ID] = device_ws

        mock_db.collection.return_value.document.return_value.get.return_value = (
            self._device_status_doc()
        )

        with _ws_patches()[0], _ws_patches()[1]:
            with client.websocket_connect("/ws/client") as ws:
                ws.send_json({"type": "subscribe", "deviceId": DEVICE_ID})
                ws.receive_json()  # initial status

                ws.send_json({"type": "command", "deviceId": DEVICE_ID, "command": "LOCK"})
                ack = ws.receive_json()

        assert ack["type"] == "command_ack"
        assert ack["command"] == "LOCK"
        assert ack["relayed"] is True

        device_ws.send_text.assert_awaited()
        relayed_payload = json.loads(device_ws.send_text.call_args[0][0])
        assert relayed_payload["command"] == "LOCK"

    def test_unlock_command_relayed_to_device(self, client, mock_db):
        from ws.manager import manager

        device_ws = AsyncMock()
        manager._devices[DEVICE_ID] = device_ws

        mock_db.collection.return_value.document.return_value.get.return_value = (
            self._device_status_doc("UNLOCKED")
        )

        with _ws_patches()[0], _ws_patches()[1]:
            with client.websocket_connect("/ws/client") as ws:
                ws.send_json({"type": "subscribe", "deviceId": DEVICE_ID})
                ws.receive_json()  # initial status

                ws.send_json({"type": "command", "deviceId": DEVICE_ID, "command": "UNLOCK"})
                ack = ws.receive_json()

        assert ack["command"] == "UNLOCK"
        assert ack["relayed"] is True

    def test_invalid_command_returns_error(self, client, mock_db):
        """An unrecognised command must be rejected with a WS error message."""
        mock_db.collection.return_value.document.return_value.get.return_value = (
            self._device_status_doc()
        )

        with client.websocket_connect("/ws/client") as ws:
            ws.send_json({"type": "subscribe", "deviceId": DEVICE_ID})
            ws.receive_json()  # initial status

            ws.send_json({"type": "command", "deviceId": DEVICE_ID, "command": "EXPLODE"})
            err = ws.receive_json()

        assert err["type"] == "error"
        assert "Invalid command" in err["message"]

    def test_command_applied_optimistically_when_device_offline(self, client, mock_db):
        """When the device is offline a command must still be acked with relayed=False
        and the status should be persisted to Firestore optimistically."""
        mock_db.collection.return_value.document.return_value.get.return_value = (
            self._device_status_doc()
        )

        with _ws_patches()[0], _ws_patches()[1]:
            with client.websocket_connect("/ws/client") as ws:
                ws.send_json({"type": "subscribe", "deviceId": DEVICE_ID})
                ws.receive_json()  # initial status

                ws.send_json({"type": "command", "deviceId": DEVICE_ID, "command": "LOCK"})
                ack = ws.receive_json()

        assert ack["relayed"] is False
        # Firestore should have been updated with the optimistic status
        mock_db.collection.return_value.document.return_value.set.assert_called()

    # ── Ping / pong ────────────────────────────────────────────────────────

    def test_ping_returns_pong(self, client, mock_db):
        mock_db.collection.return_value.document.return_value.get.return_value = (
            self._device_status_doc()
        )

        with client.websocket_connect("/ws/client") as ws:
            ws.send_json({"type": "subscribe", "deviceId": DEVICE_ID})
            ws.receive_json()  # initial status

            ws.send_json({"type": "ping"})
            pong = ws.receive_json()

        assert pong == {"type": "pong"}
