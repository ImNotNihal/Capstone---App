"""
Create and query events / alerts in Firestore.

Event types (non-exhaustive):
  LOCKED | UNLOCKED | MOTION_DETECTED | FACE_RECOGNIZED | FACE_UNKNOWN
  FINGERPRINT_SUCCESS | FINGERPRINT_FAILED | KEYPAD_SUCCESS | KEYPAD_FAILED
  BLUETOOTH_CONNECTED | CAMERA_TRIGGERED | DOOR_OPENED | DOOR_CLOSED

Alert severity:
  info | warning | danger
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from db.firebase import db
from services.notification_service import send_push_notification

logger = logging.getLogger(__name__)

# ─── Event helpers ────────────────────────────────────────────────────────────

_ALERT_SEVERITY: dict[str, str] = {
    "LOCKED": "info",
    "UNLOCKED": "info",
    "DOOR_OPENED": "warning",
    "DOOR_CLOSED": "info",
    "MOTION_DETECTED": "warning",
    "FACE_RECOGNIZED": "info",
    "FACE_UNKNOWN": "danger",
    "FINGERPRINT_SUCCESS": "info",
    "FINGERPRINT_FAILED": "warning",
    "KEYPAD_SUCCESS": "info",
    "KEYPAD_FAILED": "warning",
    "AUTH_FAILED": "danger",
    "CAMERA_TRIGGERED": "info",
}

_ALERT_MESSAGES: dict[str, str] = {
    "LOCKED": "Door has been locked.",
    "UNLOCKED": "Door has been unlocked.",
    "DOOR_OPENED": "Door opened.",
    "DOOR_CLOSED": "Door closed.",
    "MOTION_DETECTED": "Motion detected near the door.",
    "FACE_RECOGNIZED": "Face recognized — access granted.",
    "FACE_UNKNOWN": "Unknown face detected.",
    "FINGERPRINT_SUCCESS": "Fingerprint accepted.",
    "FINGERPRINT_FAILED": "Fingerprint scan failed.",
    "KEYPAD_SUCCESS": "Keypad code accepted.",
    "KEYPAD_FAILED": "Incorrect keypad code entered.",
    "AUTH_FAILED": "Multiple failed authentication attempts detected.",
    "CAMERA_TRIGGERED": "Camera recording started.",
}


async def log_event(
    device_id: str,
    event_type: str,
    user_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> str:
    """Write an event document to Firestore and return its id."""
    doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    doc = {
        "deviceId": device_id,
        "userId": user_id,
        "type": event_type,
        "timestamp": now,
        "metadata": metadata or {},
        "acknowledged": False,
    }

    db.collection("events").document(doc_id).set(doc)
    logger.info("Event logged: %s %s", event_type, doc_id)

    # Also create an alert if the event warrants one
    severity = _ALERT_SEVERITY.get(event_type)
    if severity:
        await _create_alert(device_id, event_type, user_id, severity, doc_id)

    return doc_id


async def _create_alert(
    device_id: str,
    event_type: str,
    user_id: str | None,
    severity: str,
    event_id: str,
) -> None:
    """Write an alert and push a notification to the device owner."""
    doc_id = str(uuid.uuid4())
    message = _ALERT_MESSAGES.get(event_type, event_type)

    # Resolve the owner's uid for alerts / notifications
    owner_id = user_id
    if not owner_id:
        try:
            device_doc = db.collection("devices").document(device_id).get()
            if device_doc.exists:
                owner_id = device_doc.to_dict().get("ownerId")
        except Exception as exc:
            logger.warning("Could not resolve ownerId for %s: %s", device_id, exc)

    alert = {
        "userId": owner_id or "unknown",
        "deviceId": device_id,
        "type": event_type,
        "message": message,
        "read": False,
        "timestamp": datetime.now(timezone.utc),
        "severity": severity,
        "eventId": event_id,
    }

    db.collection("alerts").document(doc_id).set(alert)

    # Fire push notification if we know the owner
    if owner_id:
        try:
            user_doc = db.collection("users").document(owner_id).get()
            if user_doc.exists:
                fcm_token = user_doc.to_dict().get("fcmToken")
                if fcm_token:
                    await send_push_notification(
                        token=fcm_token,
                        title=_alert_title(event_type),
                        body=message,
                        data={"deviceId": device_id, "type": event_type},
                    )
        except Exception as exc:
            logger.warning("Push notification failed: %s", exc)


def _alert_title(event_type: str) -> str:
    titles = {
        "LOCKED": "Door Locked",
        "UNLOCKED": "Door Unlocked",
        "MOTION_DETECTED": "Motion Detected",
        "FACE_UNKNOWN": "Unknown Face Detected",
        "AUTH_FAILED": "Failed Authentication",
        "CAMERA_TRIGGERED": "Camera Active",
    }
    return titles.get(event_type, "Smart Lock Alert")


# ─── Query helpers ────────────────────────────────────────────────────────────

def get_device_events(device_id: str, limit: int = 50) -> list[dict]:
    docs = (
        db.collection("events")
        .where("deviceId", "==", device_id)
        .order_by("timestamp", direction="DESCENDING")
        .limit(limit)
        .stream()
    )
    return [{"id": d.id, **d.to_dict()} for d in docs]


def get_user_alerts(user_id: str, limit: int = 50) -> list[dict]:
    docs = (
        db.collection("alerts")
        .where("userId", "==", user_id)
        .order_by("timestamp", direction="DESCENDING")
        .limit(limit)
        .stream()
    )
    return [{"id": d.id, **d.to_dict()} for d in docs]
