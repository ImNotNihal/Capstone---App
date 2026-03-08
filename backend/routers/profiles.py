"""
Device profile management routes.

GET    /devices/{device_id}/fingerprints           – list fingerprint profiles
POST   /devices/{device_id}/fingerprints           – enroll fingerprint
DELETE /devices/{device_id}/fingerprints/{id}      – remove fingerprint

GET    /devices/{device_id}/faces                  – list face profiles
POST   /devices/{device_id}/faces                  – enroll face
DELETE /devices/{device_id}/faces/{id}             – remove face

GET    /devices/{device_id}/pins                   – list PIN codes
POST   /devices/{device_id}/pins                   – add PIN code
DELETE /devices/{device_id}/pins/{id}              – delete PIN code

POST   /devices/{device_id}/invite                 – invite user by email
"""

import uuid
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Path, status

from db.firebase import db
from middleware.auth import get_current_user
from schemas.profile import FingerprintProfile, FaceProfile, PinCode, InviteRequest

logger = logging.getLogger(__name__)
router = APIRouter(tags=["profiles"])


# ─── Fingerprint Profiles ─────────────────────────────────────────────────────

@router.get("/devices/{device_id}/fingerprints")
async def list_fingerprints(
    device_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    docs = db.collection("fingerprint_profiles").where("deviceId", "==", device_id).stream()
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


@router.post("/devices/{device_id}/fingerprints", status_code=status.HTTP_201_CREATED)
async def add_fingerprint(
    body: FingerprintProfile,
    device_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    data = {
        "label": body.label,
        "userId": current_user["uid"],
        "deviceId": device_id,
        "createdAt": now,
    }
    db.collection("fingerprint_profiles").document(doc_id).set(data)
    return {"id": doc_id, **data}


@router.delete("/devices/{device_id}/fingerprints/{profile_id}", status_code=status.HTTP_200_OK)
async def delete_fingerprint(
    device_id: str = Path(...),
    profile_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    doc_ref = db.collection("fingerprint_profiles").document(profile_id)
    doc = doc_ref.get()
    if not doc.exists or doc.to_dict().get("deviceId") != device_id:
        raise HTTPException(status_code=404, detail="Profile not found")
    doc_ref.delete()
    return {"deleted": profile_id}


# ─── Face Profiles ────────────────────────────────────────────────────────────

@router.get("/devices/{device_id}/faces")
async def list_faces(
    device_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    docs = db.collection("face_profiles").where("deviceId", "==", device_id).stream()
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


@router.post("/devices/{device_id}/faces", status_code=status.HTTP_201_CREATED)
async def add_face(
    body: FaceProfile,
    device_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    data = {
        "name": body.name,
        "accessLevel": body.accessLevel,
        "scheduleDetails": body.scheduleDetails,
        "deviceId": device_id,
        "enrolledBy": current_user["uid"],
        "enrolledAt": now,
    }
    db.collection("face_profiles").document(doc_id).set(data)
    return {"id": doc_id, **data}


@router.delete("/devices/{device_id}/faces/{profile_id}", status_code=status.HTTP_200_OK)
async def delete_face(
    device_id: str = Path(...),
    profile_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    doc_ref = db.collection("face_profiles").document(profile_id)
    doc = doc_ref.get()
    if not doc.exists or doc.to_dict().get("deviceId") != device_id:
        raise HTTPException(status_code=404, detail="Profile not found")
    doc_ref.delete()
    return {"deleted": profile_id}


# ─── PIN Codes ────────────────────────────────────────────────────────────────

@router.get("/devices/{device_id}/pins")
async def list_pins(
    device_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    docs = db.collection("pin_codes").where("deviceId", "==", device_id).stream()
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


@router.post("/devices/{device_id}/pins", status_code=status.HTTP_201_CREATED)
async def add_pin(
    body: PinCode,
    device_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    strength = "Strong" if len(body.code) >= 6 else "Moderate"
    data = {
        "label": body.label,
        "code": body.code,
        "pinType": body.pinType,
        "strength": strength,
        "deviceId": device_id,
        "createdBy": current_user["uid"],
        "createdAt": now,
    }
    db.collection("pin_codes").document(doc_id).set(data)
    return {"id": doc_id, **data}


@router.delete("/devices/{device_id}/pins/{pin_id}", status_code=status.HTTP_200_OK)
async def delete_pin(
    device_id: str = Path(...),
    pin_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    doc_ref = db.collection("pin_codes").document(pin_id)
    doc = doc_ref.get()
    if not doc.exists or doc.to_dict().get("deviceId") != device_id:
        raise HTTPException(status_code=404, detail="PIN not found")
    doc_ref.delete()
    return {"deleted": pin_id}


# ─── Invite User ──────────────────────────────────────────────────────────────

@router.post("/devices/{device_id}/invite", status_code=status.HTTP_200_OK)
async def invite_user(
    body: InviteRequest,
    device_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    """Invite a user by email to access this device."""
    from services.device_service import get_device
    device = get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if device.get("ownerId") != current_user["uid"]:
        raise HTTPException(status_code=403, detail="Only the device owner can invite users")

    doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    invite_data = {
        "email": body.email,
        "deviceId": device_id,
        "role": body.role,
        "invitedBy": current_user["uid"],
        "invitedAt": now,
        "status": "pending",
    }

    # Check if user already exists in our system
    user_docs = list(
        db.collection("users").where("email", "==", body.email).limit(1).stream()
    )
    if user_docs:
        invited_uid = user_docs[0].id
        invite_data["userId"] = invited_uid
        # Grant device access immediately
        db.collection("device_access").document(f"{device_id}_{invited_uid}").set({
            "deviceId": device_id,
            "userId": invited_uid,
            "role": body.role,
            "grantedAt": now,
            "grantedBy": current_user["uid"],
        })

    db.collection("invites").document(doc_id).set(invite_data)
    return {"status": "invite_sent", "email": body.email, "role": body.role}
