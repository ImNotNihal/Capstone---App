"""
Unit tests for ConnectionManager (ws/manager.py).

These tests exercise the relay/broadcast logic directly without going through
HTTP or WebSocket transport. All WebSocket objects are replaced with simple
async mocks.
"""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock

from ws.manager import ConnectionManager


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _make_ws(*, send_raises: Exception | None = None) -> AsyncMock:
    """Create a minimal mock WebSocket."""
    ws = AsyncMock()
    ws.accept = AsyncMock()
    ws.close = AsyncMock()
    if send_raises:
        ws.send_text = AsyncMock(side_effect=send_raises)
    return ws


def _fresh_manager() -> ConnectionManager:
    """Return a new, isolated ConnectionManager for each test."""
    return ConnectionManager()


# ─── Device management ────────────────────────────────────────────────────────

class TestDeviceManagement:
    async def test_device_is_online_after_connect(self):
        m = _fresh_manager()
        ws = _make_ws()
        await m.connect_device("lock_A", ws)
        assert m.device_is_online("lock_A") is True

    async def test_device_is_offline_before_connect(self):
        m = _fresh_manager()
        assert m.device_is_online("lock_X") is False

    async def test_device_is_offline_after_disconnect(self):
        m = _fresh_manager()
        ws = _make_ws()
        await m.connect_device("lock_A", ws)
        m.disconnect_device("lock_A")
        assert m.device_is_online("lock_A") is False

    async def test_connect_device_closes_stale_connection(self):
        m = _fresh_manager()
        old_ws = _make_ws()
        new_ws = _make_ws()

        await m.connect_device("lock_A", old_ws)
        await m.connect_device("lock_A", new_ws)  # replaces old

        old_ws.close.assert_awaited_once()
        assert m._devices["lock_A"] is new_ws

    async def test_disconnect_device_is_idempotent(self):
        m = _fresh_manager()
        # Should not raise even when device was never registered
        m.disconnect_device("lock_UNKNOWN")


# ─── Client management ────────────────────────────────────────────────────────

class TestClientManagement:
    async def test_connect_client_adds_to_subscription_set(self):
        m = _fresh_manager()
        ws = _make_ws()
        await m.connect_client("lock_A", ws)
        assert ws in m._clients["lock_A"]

    async def test_disconnect_client_removes_from_set(self):
        m = _fresh_manager()
        ws = _make_ws()
        await m.connect_client("lock_A", ws)
        m.disconnect_client("lock_A", ws)
        assert "lock_A" not in m._clients

    async def test_disconnect_client_keeps_other_subscribers(self):
        m = _fresh_manager()
        ws1, ws2 = _make_ws(), _make_ws()
        await m.connect_client("lock_A", ws1)
        await m.connect_client("lock_A", ws2)
        m.disconnect_client("lock_A", ws1)
        assert ws2 in m._clients["lock_A"]
        assert ws1 not in m._clients.get("lock_A", set())

    async def test_multiple_devices_have_independent_subscription_sets(self):
        m = _fresh_manager()
        ws_a, ws_b = _make_ws(), _make_ws()
        await m.connect_client("lock_A", ws_a)
        await m.connect_client("lock_B", ws_b)
        m.disconnect_client("lock_A", ws_a)
        assert ws_b in m._clients["lock_B"]


# ─── relay_to_device ──────────────────────────────────────────────────────────

class TestRelayToDevice:
    async def test_returns_true_and_sends_when_device_connected(self):
        m = _fresh_manager()
        ws = _make_ws()
        await m.connect_device("lock_A", ws)

        payload = {"type": "command", "command": "LOCK"}
        result = await m.relay_to_device("lock_A", payload)

        assert result is True
        ws.send_text.assert_awaited_once_with(json.dumps(payload))

    async def test_returns_false_when_device_not_connected(self):
        m = _fresh_manager()
        result = await m.relay_to_device("lock_MISSING", {"type": "command"})
        assert result is False

    async def test_disconnects_device_on_send_failure(self):
        m = _fresh_manager()
        ws = _make_ws(send_raises=RuntimeError("broken pipe"))
        await m.connect_device("lock_A", ws)

        result = await m.relay_to_device("lock_A", {"type": "command"})

        assert result is False
        assert m.device_is_online("lock_A") is False


# ─── relay_to_clients ─────────────────────────────────────────────────────────

class TestRelayToClients:
    async def test_broadcasts_to_all_subscribers(self):
        m = _fresh_manager()
        ws1, ws2 = _make_ws(), _make_ws()
        await m.connect_client("lock_A", ws1)
        await m.connect_client("lock_A", ws2)

        payload = {"type": "status", "status": "LOCKED"}
        sent = await m.relay_to_clients("lock_A", payload)

        assert sent == 2
        expected = json.dumps(payload)
        ws1.send_text.assert_awaited_once_with(expected)
        ws2.send_text.assert_awaited_once_with(expected)

    async def test_returns_zero_with_no_subscribers(self):
        m = _fresh_manager()
        sent = await m.relay_to_clients("lock_NONE", {"type": "status"})
        assert sent == 0

    async def test_prunes_dead_connections_on_send_failure(self):
        m = _fresh_manager()
        live_ws = _make_ws()
        dead_ws = _make_ws(send_raises=RuntimeError("client gone"))

        await m.connect_client("lock_A", live_ws)
        await m.connect_client("lock_A", dead_ws)

        sent = await m.relay_to_clients("lock_A", {"type": "status"})

        assert sent == 1
        assert dead_ws not in m._clients.get("lock_A", set())
        assert live_ws in m._clients["lock_A"]

    async def test_does_not_affect_other_device_subscriptions(self):
        m = _fresh_manager()
        ws_a = _make_ws()
        ws_b = _make_ws()
        await m.connect_client("lock_A", ws_a)
        await m.connect_client("lock_B", ws_b)

        await m.relay_to_clients("lock_A", {"type": "status"})

        ws_b.send_text.assert_not_awaited()


# ─── broadcast_status ─────────────────────────────────────────────────────────

class TestBroadcastStatus:
    async def test_sends_correct_status_payload(self):
        m = _fresh_manager()
        ws = _make_ws()
        await m.connect_client("lock_A", ws)

        await m.broadcast_status("lock_A", "LOCKED")

        expected = json.dumps({
            "type": "status",
            "deviceId": "lock_A",
            "status": "LOCKED",
        })
        ws.send_text.assert_awaited_once_with(expected)

    async def test_broadcast_is_no_op_when_no_clients(self):
        m = _fresh_manager()
        # Should not raise
        await m.broadcast_status("lock_EMPTY", "LOCKED")


# ─── stats ────────────────────────────────────────────────────────────────────

class TestStats:
    async def test_stats_reports_connected_devices_and_clients(self):
        m = _fresh_manager()
        dev_ws = _make_ws()
        cli_ws1 = _make_ws()
        cli_ws2 = _make_ws()

        await m.connect_device("lock_A", dev_ws)
        await m.connect_client("lock_A", cli_ws1)
        await m.connect_client("lock_A", cli_ws2)

        s = m.stats()
        assert "lock_A" in s["devices_online"]
        assert s["client_subscriptions"]["lock_A"] == 2

    async def test_stats_empty_when_nothing_connected(self):
        m = _fresh_manager()
        s = m.stats()
        assert s["devices_online"] == []
        assert s["client_subscriptions"] == {}
