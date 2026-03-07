"""
Unit tests for authentication routes.

Covers: register, login, token refresh, /me, and error cases.
Firebase Firestore calls are replaced with MagicMock via the mock_db fixture.
"""

import pytest
from unittest.mock import MagicMock, patch
from tests.conftest import make_doc, empty_stream
from services.auth_service import hash_password, create_refresh_token


# ─── /auth/register ──────────────────────────────────────────────────────────

class TestRegister:
    def test_register_new_user_returns_201_with_tokens(self, client, mock_db):
        """A valid registration should create the user and return a JWT pair."""
        # No existing user with this email
        mock_db.collection.return_value.where.return_value.limit.return_value.stream.return_value = (
            empty_stream()
        )
        # Device doc does not exist (so _ensure_device creates it)
        device_doc = MagicMock()
        device_doc.exists = False
        settings_doc = MagicMock()
        settings_doc.exists = False

        mock_db.collection.return_value.document.return_value.get.side_effect = [
            device_doc, settings_doc
        ]

        response = client.post("/auth/register", json={
            "email": "new@example.com",
            "password": "secret123",
            "firstName": "Alice",
            "lastName": "Smith",
            "deviceId": "lock_NEWDEV",
        })

        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_register_duplicate_email_returns_409(self, client, mock_db):
        """Registering with an existing email must return 409 Conflict."""
        existing = make_doc("existing-uid", {"email": "dup@example.com"})
        mock_db.collection.return_value.where.return_value.limit.return_value.stream.return_value = (
            iter([existing])
        )

        response = client.post("/auth/register", json={
            "email": "dup@example.com",
            "password": "password123",   # must be >= 8 chars
            "firstName": "Bob",
            "lastName": "Jones",
        })

        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]

    def test_register_without_device_id_does_not_provision_device(self, client, mock_db):
        """When deviceId is omitted, no device/settings documents are created."""
        mock_db.collection.return_value.where.return_value.limit.return_value.stream.return_value = (
            empty_stream()
        )

        response = client.post("/auth/register", json={
            "email": "nodev@example.com",
            "password": "password123",   # must be >= 8 chars
            "firstName": "No",
            "lastName": "Device",
        })

        assert response.status_code == 201
        # _ensure_device should NOT have been called (no device doc lookup)
        # Verify set() was called exactly once (for the user doc, not device/settings)
        set_calls = mock_db.collection.return_value.document.return_value.set.call_count
        assert set_calls == 1


# ─── /auth/login ─────────────────────────────────────────────────────────────

class TestLogin:
    def _make_user_doc(self, uid="uid-1", email="alice@example.com", password="secret"):
        return make_doc(uid, {
            "email": email,
            "firstName": "Alice",
            "lastName": "Smith",
            "hashedPassword": hash_password(password),
            "deviceId": "lock_ABC",
            "deviceIds": ["lock_ABC"],
            "role": "owner",
        })

    def test_login_correct_credentials_returns_tokens(self, client, mock_db):
        user_doc = self._make_user_doc()
        mock_db.collection.return_value.where.return_value.limit.return_value.stream.return_value = (
            iter([user_doc])
        )

        response = client.post("/auth/login", json={
            "email": "alice@example.com",
            "password": "secret",
        })

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_login_unknown_email_returns_401(self, client, mock_db):
        mock_db.collection.return_value.where.return_value.limit.return_value.stream.return_value = (
            empty_stream()
        )

        response = client.post("/auth/login", json={
            "email": "nobody@example.com",
            "password": "pass",
        })

        assert response.status_code == 401

    def test_login_wrong_password_returns_401(self, client, mock_db):
        user_doc = self._make_user_doc()
        mock_db.collection.return_value.where.return_value.limit.return_value.stream.return_value = (
            iter([user_doc])
        )

        response = client.post("/auth/login", json={
            "email": "alice@example.com",
            "password": "WRONG_PASSWORD",
        })

        assert response.status_code == 401


# ─── /auth/me ─────────────────────────────────────────────────────────────────

class TestMe:
    def test_me_returns_user_profile_when_authenticated(self, client, mock_db, auth_headers):
        headers, test_user, uid = auth_headers

        # mock_db must return the user doc when middleware fetches it
        user_doc = make_doc(uid, test_user)
        mock_db.collection.return_value.document.return_value.get.return_value = user_doc

        with patch("middleware.auth.get_current_user", return_value=test_user):
            response = client.get("/auth/me", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user["email"]
        assert data["uid"] == uid

    def test_me_returns_401_without_token(self, client, mock_db):
        response = client.get("/auth/me")
        assert response.status_code == 403  # HTTPBearer raises 403 when header missing


# ─── /auth/refresh ────────────────────────────────────────────────────────────

class TestRefresh:
    def test_refresh_valid_token_returns_new_pair(self, client, mock_db):
        uid = "uid-refresh"
        refresh_token = create_refresh_token(uid)

        response = client.post("/auth/refresh", json={"refresh_token": refresh_token})

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_refresh_invalid_token_returns_401(self, client, mock_db):
        response = client.post("/auth/refresh", json={"refresh_token": "garbage.token.here"})
        assert response.status_code == 401

    def test_refresh_with_access_token_returns_401(self, client, mock_db):
        """An access token must not be accepted as a refresh token."""
        from services.auth_service import create_access_token
        access_token = create_access_token("uid-x")

        response = client.post("/auth/refresh", json={"refresh_token": access_token})
        assert response.status_code == 401
        assert "not a refresh token" in response.json()["detail"]
