"""
Unit tests for device settings routes.

Covers: GET /settings/{device_id}, PUT /settings/{device_id},
default value handling, and authentication requirements.
"""

import pytest
from unittest.mock import patch
from tests.conftest import make_doc


DEVICE_ID = "lock_TESTDEV"

STORED_SETTINGS = {
    "autoLock": True,
    "autoLockTimeout": 60,
    "failedAttemptLimit": 3,
    "alertsEnabled": False,
    "motionSensitivity": "high",
    "cameraEnabled": True,
}


# ─── GET /settings/{device_id} ────────────────────────────────────────────────

class TestGetSettings:
    def test_returns_stored_settings(self, client, mock_db, auth_headers):
        headers, test_user, _ = auth_headers
        doc = make_doc(DEVICE_ID, STORED_SETTINGS)
        mock_db.collection.return_value.document.return_value.get.return_value = doc

        with patch("middleware.auth.get_current_user", return_value=test_user):
            response = client.get(f"/settings/{DEVICE_ID}", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["alertsEnabled"] is False
        assert data["autoLockTimeout"] == 60
        assert data["motionSensitivity"] == "high"
        assert data["deviceId"] == DEVICE_ID

    def test_returns_defaults_when_no_document_exists(self, client, mock_db, auth_headers):
        """If no settings doc exists yet, the route must fall back to defaults."""
        headers, test_user, uid = auth_headers
        # First get() is for user lookup in get_current_user; second is for settings.
        user_doc = make_doc(uid, test_user)
        missing_settings = make_doc(DEVICE_ID, {}, exists=False)
        mock_db.collection.return_value.document.return_value.get.side_effect = [
            user_doc, missing_settings
        ]

        response = client.get(f"/settings/{DEVICE_ID}", headers=headers)

        assert response.status_code == 200
        data = response.json()
        # Default values from routers/settings.py
        assert data["autoLock"] is True
        assert data["autoLockTimeout"] == 30
        assert data["failedAttemptLimit"] == 5
        assert data["alertsEnabled"] is True
        assert data["cameraEnabled"] is True

    def test_requires_authentication(self, client, mock_db):
        response = client.get(f"/settings/{DEVICE_ID}")
        assert response.status_code == 403


# ─── PUT /settings/{device_id} ────────────────────────────────────────────────

class TestUpdateSettings:
    def test_updates_settings_and_returns_new_values(self, client, mock_db, auth_headers):
        headers, test_user, _ = auth_headers
        mock_db.collection.return_value.document.return_value.set.return_value = None

        payload = {
            "autoLock": False,
            "autoLockTimeout": 120,
            "failedAttemptLimit": 10,
            "alertsEnabled": True,
            "motionSensitivity": "low",
            "cameraEnabled": False,
        }

        with patch("middleware.auth.get_current_user", return_value=test_user):
            response = client.put(f"/settings/{DEVICE_ID}", json=payload, headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["autoLock"] is False
        assert data["autoLockTimeout"] == 120
        assert data["alertsEnabled"] is True
        assert data["motionSensitivity"] == "low"
        assert data["deviceId"] == DEVICE_ID

        # Verify Firestore set() was called with merge=True
        mock_db.collection.return_value.document.return_value.set.assert_called_once()
        call_args = mock_db.collection.return_value.document.return_value.set.call_args
        assert call_args.kwargs.get("merge") is True

    def test_rejects_autolock_timeout_below_minimum(self, client, mock_db, auth_headers):
        """autoLockTimeout must be >= 5 seconds (Pydantic validation)."""
        headers, test_user, _ = auth_headers

        payload = {
            "autoLock": True,
            "autoLockTimeout": 1,   # below the ge=5 constraint
            "failedAttemptLimit": 5,
            "alertsEnabled": True,
            "motionSensitivity": "medium",
            "cameraEnabled": True,
        }

        with patch("middleware.auth.get_current_user", return_value=test_user):
            response = client.put(f"/settings/{DEVICE_ID}", json=payload, headers=headers)

        assert response.status_code == 422

    def test_rejects_failed_attempt_limit_above_maximum(self, client, mock_db, auth_headers):
        """failedAttemptLimit must be <= 20 (Pydantic validation)."""
        headers, test_user, _ = auth_headers

        payload = {
            "autoLock": True,
            "autoLockTimeout": 30,
            "failedAttemptLimit": 99,   # above the le=20 constraint
            "alertsEnabled": True,
            "motionSensitivity": "medium",
            "cameraEnabled": True,
        }

        with patch("middleware.auth.get_current_user", return_value=test_user):
            response = client.put(f"/settings/{DEVICE_ID}", json=payload, headers=headers)

        assert response.status_code == 422

    def test_requires_authentication(self, client, mock_db):
        response = client.put(f"/settings/{DEVICE_ID}", json={})
        assert response.status_code == 403
