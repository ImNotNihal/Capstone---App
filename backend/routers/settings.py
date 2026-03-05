"""
Device settings routes.

GET /settings/{device_id}   – read current settings
PUT /settings/{device_id}   – update settings
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Path, status

from db.firebase import db
from middleware.auth import get_current_user
from schemas.settings import DeviceSettings, SettingsOut

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/settings", tags=["settings"])

_DEFAULTS = {
    "autoLock": True,
    "autoLockTimeout": 30,
    "failedAttemptLimit": 5,
    "alertsEnabled": True,
    "motionSensitivity": "medium",
    "cameraEnabled": True,
}


@router.get("/{device_id}", response_model=SettingsOut)
async def get_settings(
    device_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    doc = db.collection("settings").document(device_id).get()
    data = _DEFAULTS.copy()
    if doc.exists:
        data.update(doc.to_dict())
    return SettingsOut(deviceId=device_id, **{k: data[k] for k in DeviceSettings.model_fields})


@router.put("/{device_id}", response_model=SettingsOut)
async def update_settings(
    body: DeviceSettings,
    device_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    payload = body.model_dump()
    payload["updatedAt"] = datetime.now(timezone.utc)
    db.collection("settings").document(device_id).set(payload, merge=True)
    return SettingsOut(deviceId=device_id, **body.model_dump())
