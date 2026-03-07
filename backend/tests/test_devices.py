"""
Unit tests for device control routes.

Covers: GET /status/{device_id}, POST /send-command/{device_id}/{cmd},
GET /health, and the optimistic-update path when the device is offline.
"""

import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from tests.conftest import make_doc


# ─── Helpers ──────────────────────────────────────────────────────────────────

DEVICE_ID = "lock_TESTDEV"
LOCKED_DEVICE_DATA = {
    "name": "Smart Lock TESTDEV",
    "status": "LOCKED",
    "isOnline": True,
    "ownerId": "test-user-uid",
    "lastSeen": None,
    "firmwareVersion": "1.0.0",
}


def _mock_device_doc(data=None, exists=True):
    return make_doc(DEVICE_ID, data or LOCKED_DEVICE_DATA, exists=exists)


# ─── Health check ─────────────────────────────────────────────────────────────

class TestHealth:
    def test_health_returns_ok(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


# ─── GET /status/{device_id} ──────────────────────────────────────────────────

class TestDeviceStatus:
    def test_status_returns_locked_when_device_is_locked(self, client, mock_db, auth_headers):
        headers, test_user, uid = auth_headers
        mock_db.collection.return_value.document.return_value.get.return_value = (
            _mock_device_doc()
        )

        with patch("middleware.auth.get_current_user", return_value=test_user), \
             patch("ws.manager.manager.device_is_online", return_value=True):
            response = client.get(f"/status/{DEVICE_ID}", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "LOCKED"
        assert data["deviceId"] == DEVICE_ID

    def test_status_returns_unknown_for_nonexistent_device(self, client, mock_db, auth_headers):
        headers, test_user, uid = auth_headers
        # First get() is for user lookup in get_current_user; second is for the device.
        user_doc = make_doc(uid, test_user)
        missing_device = make_doc(DEVICE_ID, {}, exists=False)
        mock_db.collection.return_value.document.return_value.get.side_effect = [
            user_doc, missing_device
        ]

        with patch("ws.manager.manager.device_is_online", return_value=False):
            response = client.get(f"/status/{DEVICE_ID}", headers=headers)

        assert response.status_code == 200
        assert response.json()["status"] == "UNKNOWN"

    def test_status_requires_authentication(self, client, mock_db):
        response = client.get(f"/status/{DEVICE_ID}")
        assert response.status_code == 403


# ─── POST /send-command/{device_id}/{command} ─────────────────────────────────

class TestSendCommand:
    def _setup_command(self, mock_db, relayed=True):
        """Patch ws manager relay and Firestore device doc."""
        mock_db.collection.return_value.document.return_value.get.return_value = (
            _mock_device_doc()
        )
        relay_patch = patch(
            "ws.manager.manager.relay_to_device",
            new=AsyncMock(return_value=relayed),
        )
        broadcast_patch = patch(
            "ws.manager.manager.broadcast_status",
            new=AsyncMock(return_value=None),
        )
        log_patch = patch(
            "services.event_service.log_event",
            new=AsyncMock(return_value=None),
        )
        return relay_patch, broadcast_patch, log_patch

    def test_lock_command_returns_success(self, client, mock_db, auth_headers):
        headers, test_user, uid = auth_headers
        relay, broadcast, log_ev = self._setup_command(mock_db, relayed=True)

        with patch("middleware.auth.get_current_user", return_value=test_user), \
             relay, broadcast, log_ev:
            response = client.post(f"/send-command/{DEVICE_ID}/LOCK", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["command"] == "LOCK"
        assert data["relayed"] is True

    def test_unlock_command_returns_success(self, client, mock_db, auth_headers):
        headers, test_user, uid = auth_headers
        relay, broadcast, log_ev = self._setup_command(mock_db, relayed=True)

        with patch("middleware.auth.get_current_user", return_value=test_user), \
             relay, broadcast, log_ev:
            response = client.post(f"/send-command/{DEVICE_ID}/UNLOCK", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["command"] == "UNLOCK"

    def test_command_applies_optimistically_when_device_offline(
        self, client, mock_db, auth_headers
    ):
        """When relay fails (device offline), Firestore is updated optimistically."""
        headers, test_user, uid = auth_headers
        relay, broadcast, log_ev = self._setup_command(mock_db, relayed=False)

        with patch("middleware.auth.get_current_user", return_value=test_user), \
             relay, broadcast, log_ev:
            response = client.post(f"/send-command/{DEVICE_ID}/LOCK", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["relayed"] is False
        # Firestore set() should have been called for optimistic update
        assert mock_db.collection.return_value.document.return_value.set.called

    def test_invalid_command_returns_422(self, client, mock_db, auth_headers):
        headers, test_user, _ = auth_headers

        with patch("middleware.auth.get_current_user", return_value=test_user):
            response = client.post(f"/send-command/{DEVICE_ID}/EXPLODE", headers=headers)

        assert response.status_code == 422

    def test_command_requires_authentication(self, client, mock_db):
        response = client.post(f"/send-command/{DEVICE_ID}/LOCK")
        assert response.status_code == 403
