"""
Lock / unlock logic and device status helpers.
"""

import logging
from datetime import datetime, timezone

from db.firebase import db

logger = logging.getLogger(__name__)


def get_device(device_id: str) -> dict | None:
    doc = db.collection("devices").document(device_id).get()
    return {"deviceId": doc.id, **doc.to_dict()} if doc.exists else None


def get_or_create_device(device_id: str, owner_id: str) -> dict:
    """Return existing device doc or create a stub record."""
    doc = db.collection("devices").document(device_id).get()
    if doc.exists:
        return {"deviceId": doc.id, **doc.to_dict()}

    stub = {
        "name": f"Smart Lock {device_id[-6:]}",
        "status": "LOCKED",
        "isOnline": False,
        "ownerId": owner_id,
        "lastSeen": None,
        "firmwareVersion": None,
        "createdAt": datetime.now(timezone.utc),
    }
    db.collection("devices").document(device_id).set(stub)
    return {"deviceId": device_id, **stub}


def set_lock_status(device_id: str, status: str) -> None:
    """Persist lock status to Firestore (called after command is relayed)."""
    db.collection("devices").document(device_id).set(
        {"status": status, "lastSeen": datetime.now(timezone.utc)},
        merge=True,
    )


def mark_device_online(device_id: str, online: bool) -> None:
    db.collection("devices").document(device_id).set(
        {"isOnline": online, "lastSeen": datetime.now(timezone.utc)},
        merge=True,
    )


def get_device_status(device_id: str) -> dict:
    device = get_device(device_id)
    if not device:
        return {"deviceId": device_id, "status": "UNKNOWN", "isOnline": False, "lastSeen": None}
    return {
        "deviceId": device_id,
        "status": device.get("status", "UNKNOWN"),
        "isOnline": device.get("isOnline", False),
        "lastSeen": device.get("lastSeen"),
    }
