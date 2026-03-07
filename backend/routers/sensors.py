"""
Sensor routes.

GET   /devices/{device_id}/sensors               – list sensors (seeds defaults on first call)
PATCH /devices/{device_id}/sensors/{sensor_id}   – toggle a sensor's status
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Path

from db.firebase import db
from middleware.auth import get_current_user
from schemas.sensor import SensorOut, SensorPatch

logger = logging.getLogger(__name__)
router = APIRouter(tags=["sensors"])

# Default sensors seeded the first time a device is queried
_SENSOR_DEFAULTS = [
    {
        "id": "lock-front",
        "name": "Front Door Lock",
        "type": "Lock",
        "status": "active",
        "battery": 85,
        "location": "Main entrance",
    },
    {
        "id": "motion-front",
        "name": "Motion Sensor",
        "type": "Motion",
        "status": "active",
        "battery": 92,
        "location": "Front porch",
    },
    {
        "id": "camera-door",
        "name": "Door Camera",
        "type": "Camera",
        "status": "active",
        "battery": None,
        "location": "Above door",
    },
    {
        "id": "contact-window",
        "name": "Living Room Window",
        "type": "Contact",
        "status": "active",
        "battery": 78,
        "location": "Living room",
    },
]


def _sensors_coll(device_id: str):
    return db.collection("devices").document(device_id).collection("sensors")


def _seed(device_id: str) -> None:
    """Write default sensor docs for a device that has none yet."""
    coll = _sensors_coll(device_id)
    now = datetime.now(timezone.utc).isoformat()
    for s in _SENSOR_DEFAULTS:
        ref = coll.document(s["id"])
        if not ref.get().exists:
            ref.set({**{k: v for k, v in s.items() if k != "id"}, "lastUpdate": now})


def _doc_to_out(doc) -> SensorOut:
    d = doc.to_dict()
    last = d.get("lastUpdate", "")
    if hasattr(last, "isoformat"):
        last = last.isoformat()
    return SensorOut(
        id=doc.id,
        name=d.get("name", ""),
        type=d.get("type", ""),
        status=d.get("status", "inactive"),
        battery=d.get("battery"),
        location=d.get("location", ""),
        lastUpdate=last,
    )


@router.get("/devices/{device_id}/sensors", response_model=list[SensorOut])
async def list_sensors(
    device_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    coll = _sensors_coll(device_id)
    docs = list(coll.stream())
    if not docs:
        _seed(device_id)
        docs = list(coll.stream())
    return [_doc_to_out(doc) for doc in docs]


@router.patch(
    "/devices/{device_id}/sensors/{sensor_id}",
    response_model=SensorOut,
    summary="Toggle sensor active/inactive",
)
async def update_sensor(
    body: SensorPatch,
    device_id: str = Path(...),
    sensor_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    if body.status not in ("active", "inactive"):
        raise HTTPException(status_code=400, detail="status must be 'active' or 'inactive'")

    ref = _sensors_coll(device_id).document(sensor_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Sensor not found.")

    now = datetime.now(timezone.utc).isoformat()
    ref.update({"status": body.status, "lastUpdate": now})
    return _doc_to_out(ref.get())
