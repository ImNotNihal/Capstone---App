"""
Events and alerts routes.

GET /devices/{device_id}/events          – paginated event log for a device
GET /users/{user_id}/alerts              – paginated alert list for a user
PATCH /alerts/{alert_id}/read            – mark an alert as read
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from db.firebase import db
from middleware.auth import get_current_user
from schemas.event import AlertOut, EventOut
from services.event_service import get_device_events, get_user_alerts

logger = logging.getLogger(__name__)
router = APIRouter(tags=["events"])


def _serialize_ts(obj):
    """Convert Firestore DatetimeWithNanoseconds to ISO string."""
    from datetime import datetime
    if hasattr(obj, "isoformat"):
        return obj.isoformat()
    return obj


def _hydrate(doc: dict) -> dict:
    """Make all timestamp fields JSON-serialisable."""
    return {
        k: (_serialize_ts(v) if hasattr(v, "isoformat") else v)
        for k, v in doc.items()
    }


# ─── Events ───────────────────────────────────────────────────────────────────

@router.get(
    "/devices/{device_id}/events",
    summary="Get activity log for a device",
)
async def list_events(
    device_id: str = Path(...),
    limit: int = Query(default=50, le=200),
    current_user: dict = Depends(get_current_user),
):
    events = get_device_events(device_id, limit=limit)
    return [_hydrate(e) for e in events]


# ─── Alerts ───────────────────────────────────────────────────────────────────

@router.get(
    "/users/{user_id}/alerts",
    summary="Get alerts for a user",
)
async def list_alerts(
    user_id: str = Path(...),
    limit: int = Query(default=50, le=200),
    current_user: dict = Depends(get_current_user),
):
    # Users may only retrieve their own alerts
    if user_id != current_user["uid"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You may only view your own alerts.",
        )
    alerts = get_user_alerts(user_id, limit=limit)
    return [_hydrate(a) for a in alerts]


@router.patch(
    "/alerts/{alert_id}/read",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Mark an alert as read",
)
async def mark_alert_read(
    alert_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    ref = db.collection("alerts").document(alert_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Alert not found.")
    if doc.to_dict().get("userId") != current_user["uid"]:
        raise HTTPException(status_code=403, detail="Forbidden.")
    ref.update({"read": True})
