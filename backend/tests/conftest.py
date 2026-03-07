"""
Pytest configuration and shared fixtures for backend tests.

Firebase Admin SDK is patched at the sys.modules level BEFORE any app
code is imported, so the SDK never attempts to contact Google's servers
during testing.
"""

import sys
from unittest.mock import MagicMock, patch

# ─── Patch Firebase Admin SDK before any app imports ──────────────────────────
# firebase_admin calls _init_app() at module level in db/firebase.py, so we
# must stub the entire package in sys.modules before importing the FastAPI app.

_mock_firebase_admin = MagicMock()
_mock_firebase_admin.App = MagicMock
_mock_credentials = MagicMock()
_mock_firestore = MagicMock()
_mock_messaging = MagicMock()
_mock_storage = MagicMock()

sys.modules.setdefault("firebase_admin", _mock_firebase_admin)
sys.modules.setdefault("firebase_admin.credentials", _mock_credentials)
sys.modules.setdefault("firebase_admin.firestore", _mock_firestore)
sys.modules.setdefault("firebase_admin.messaging", _mock_messaging)
sys.modules.setdefault("firebase_admin.storage", _mock_storage)

# Also stub firebase_admin.initialize_app so it doesn't error
_mock_firebase_admin.initialize_app.return_value = MagicMock()
_mock_firebase_admin.get_app.side_effect = ValueError("not found")

# ─── Imports (after stubs are in place) ───────────────────────────────────────

import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock

# ─── Firestore mock helpers ───────────────────────────────────────────────────

def _make_doc(id_: str, data: dict, exists: bool = True):
    """Build a minimal Firestore DocumentSnapshot mock."""
    doc = MagicMock()
    doc.id = id_
    doc.exists = exists
    doc.to_dict.return_value = data
    return doc


def _empty_stream():
    """Return an iterator that yields nothing (empty query result)."""
    return iter([])


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def app():
    """Create the FastAPI app once per test session."""
    from main import app as fastapi_app
    return fastapi_app


@pytest.fixture(scope="session")
def client(app):
    """TestClient bound to the FastAPI app (session-scoped for speed)."""
    return TestClient(app)


@pytest.fixture()
def mock_db(app):
    """
    Yield a fresh Firestore db mock for each test.
    Patches db.firebase.db AND every router/service that imports `db` directly.
    """
    mock = MagicMock()

    # Only patch modules that actually import `db` via `from db.firebase import db`.
    # routers/devices.py delegates to services.device_service, not a direct import.
    patches = [
        patch("db.firebase.db", mock),
        patch("routers.auth.db", mock),
        patch("routers.settings.db", mock),
        patch("services.device_service.db", mock),
        patch("middleware.auth.db", mock),
    ]

    for p in patches:
        p.start()

    yield mock

    for p in patches:
        p.stop()


@pytest.fixture()
def auth_headers():
    """
    Return Authorization headers containing a real signed JWT for a test user.
    Also patches middleware.auth.get_current_user to bypass Firestore lookups.
    """
    from services.auth_service import create_access_token
    uid = "test-user-uid"
    token = create_access_token(uid)

    test_user = {
        "uid": uid,
        "email": "test@example.com",
        "firstName": "Test",
        "lastName": "User",
        "deviceId": "lock_TESTDEV",
        "deviceIds": ["lock_TESTDEV"],
        "role": "owner",
        "hashedPassword": "",
    }

    with patch("middleware.auth.get_current_user", return_value=test_user):
        yield {"Authorization": f"Bearer {token}"}, test_user, uid


# ─── Expose helpers for test modules ─────────────────────────────────────────
make_doc = _make_doc
empty_stream = _empty_stream
