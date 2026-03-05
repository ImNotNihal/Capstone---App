"""
Camera recording / media routes.

POST /media/upload             – upload a recording (multipart/form-data)
GET  /media/{device_id}        – list recording metadata for a device
"""

import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from db.firebase import db, get_storage_bucket
from middleware.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/media", tags=["media"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_CONTENT_TYPES = {
    "video/mp4", "video/quicktime", "video/x-msvideo",
    "image/jpeg", "image/png",
}


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_media(
    device_id: str = Form(...),
    event_type: str = Form(default="CAMERA_TRIGGERED"),
    duration: int | None = Form(default=None),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported media type.")

    recording_id = str(uuid.uuid4())
    ext = Path(file.filename or "recording.mp4").suffix
    filename = f"{recording_id}{ext}"

    # Try Cloud Storage first; fall back to local disk
    bucket = get_storage_bucket()
    if bucket:
        blob = bucket.blob(f"recordings/{device_id}/{filename}")
        contents = await file.read()
        blob.upload_from_string(contents, content_type=file.content_type)
        blob.make_public()
        media_url = blob.public_url
    else:
        dest = UPLOAD_DIR / device_id
        dest.mkdir(parents=True, exist_ok=True)
        contents = await file.read()
        (dest / filename).write_bytes(contents)
        media_url = f"/media/files/{device_id}/{filename}"

    # Store metadata in Firestore
    doc = {
        "deviceId": device_id,
        "uploadedBy": current_user["uid"],
        "eventType": event_type,
        "timestamp": datetime.now(timezone.utc),
        "mediaUrl": media_url,
        "filename": filename,
        "duration": duration,
        "thumbnail": None,
    }
    db.collection("camera_recordings").document(recording_id).set(doc)

    logger.info("Media uploaded: %s for device %s", recording_id, device_id)
    return {"id": recording_id, "mediaUrl": media_url}


@router.get("/{device_id}", summary="List recordings for a device")
async def list_media(
    device_id: str,
    current_user: dict = Depends(get_current_user),
):
    docs = (
        db.collection("camera_recordings")
        .where("deviceId", "==", device_id)
        .order_by("timestamp", direction="DESCENDING")
        .limit(50)
        .stream()
    )

    def _fmt(doc):
        d = {"id": doc.id, **doc.to_dict()}
        ts = d.get("timestamp")
        if hasattr(ts, "isoformat"):
            d["timestamp"] = ts.isoformat()
        return d

    return [_fmt(d) for d in docs]
