"""
Firebase Admin SDK initialisation.

The SDK is initialised once (singleton pattern) using either:
  1. FIREBASE_SERVICE_ACCOUNT_PATH  – path to a service-account JSON file
  2. GOOGLE_APPLICATION_CREDENTIALS – standard Google env var (ADC / Cloud Run)

All modules import `db` from here to talk to Firestore.
"""

import os
import logging
from functools import lru_cache

import firebase_admin
from firebase_admin import credentials, firestore, messaging, storage

logger = logging.getLogger(__name__)

_app: firebase_admin.App | None = None


def _init_app() -> firebase_admin.App:
    """Initialise the Firebase Admin app exactly once."""
    global _app
    if _app is not None:
        return _app

    sa_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
    bucket = os.getenv("FIREBASE_STORAGE_BUCKET", "")

    kwargs: dict = {}
    if bucket:
        kwargs["storageBucket"] = bucket

    if sa_path and os.path.isfile(sa_path):
        cred = credentials.Certificate(sa_path)
        logger.info("Firebase: initialising with service account file %s", sa_path)
    else:
        # Falls back to Application Default Credentials (Cloud Run, GKE, etc.)
        cred = credentials.ApplicationDefault()
        logger.info("Firebase: initialising with Application Default Credentials")

    _app = firebase_admin.initialize_app(cred, kwargs)
    return _app


# Initialise on import
_init_app()

# Public clients ─────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def get_db() -> firestore.client:
    """Return the Firestore client (cached)."""
    return firestore.client()


@lru_cache(maxsize=1)
def get_messaging() -> messaging:
    """Return the FCM messaging module (cached)."""
    return messaging


def get_storage_bucket():
    """Return the default Cloud Storage bucket, or None if not configured."""
    bucket_name = os.getenv("FIREBASE_STORAGE_BUCKET", "")
    if not bucket_name:
        return None
    return storage.bucket(bucket_name)


# Convenience alias used across the codebase
db = get_db()
