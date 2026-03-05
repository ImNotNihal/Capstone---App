"""
Credential management routes (used by the Manage Users settings screen).

GET  /credentials/me                    – list all method states for the current user
POST /credentials/me/enroll             – activate a method
POST /credentials/me/revoke             – deactivate a method
"""

import uuid
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from db.firebase import db
from middleware.auth import get_current_user
from schemas.credential import (
    CredentialEnrollRequest,
    CredentialStateOut,
    VALID_METHODS,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/credentials", tags=["credentials"])


def _get_credentials(user_id: str, device_id: str) -> dict[str, dict]:
    """Return {method: {isActive, enrolledAt, id}} for the user/device pair."""
    docs = (
        db.collection("credentials")
        .where("userId", "==", user_id)
        .where("deviceId", "==", device_id)
        .stream()
    )
    result: dict[str, dict] = {}
    for doc in docs:
        d = doc.to_dict()
        method = d.get("method")
        if method:
            result[method] = {
                "isActive": d.get("isActive", False),
                "enrolledAt": d.get("enrolledAt"),
                "id": doc.id,
            }
    return result


@router.get("/me", response_model=CredentialStateOut)
async def list_credentials(current_user: dict = Depends(get_current_user)):
    device_id = current_user.get("deviceId") or ""
    creds = _get_credentials(current_user["uid"], device_id)

    auth_methods = {
        method: creds.get(method, {"isActive": False, "enrolledAt": None})
        for method in VALID_METHODS
    }
    return CredentialStateOut(authMethods=auth_methods)


@router.post("/me/enroll", status_code=status.HTTP_200_OK)
async def enroll_credential(
    body: CredentialEnrollRequest,
    current_user: dict = Depends(get_current_user),
):
    if body.method not in VALID_METHODS:
        raise HTTPException(status_code=400, detail=f"method must be one of {VALID_METHODS}")

    device_id = current_user.get("deviceId") or ""
    uid = current_user["uid"]

    # Upsert: find existing doc or create new
    existing = list(
        db.collection("credentials")
        .where("userId", "==", uid)
        .where("deviceId", "==", device_id)
        .where("method", "==", body.method)
        .limit(1)
        .stream()
    )

    now = datetime.now(timezone.utc)
    if existing:
        existing[0].reference.update({"isActive": True, "data": body.data, "enrolledAt": now})
    else:
        doc_id = str(uuid.uuid4())
        db.collection("credentials").document(doc_id).set({
            "userId": uid,
            "deviceId": device_id,
            "method": body.method,
            "isActive": True,
            "data": body.data,
            "enrolledAt": now,
        })

    return {"method": body.method, "isActive": True}


@router.post("/me/revoke", status_code=status.HTTP_200_OK)
async def revoke_credential(
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    method = body.get("method")
    if method not in VALID_METHODS:
        raise HTTPException(status_code=400, detail=f"method must be one of {VALID_METHODS}")

    device_id = current_user.get("deviceId") or ""
    uid = current_user["uid"]

    existing = list(
        db.collection("credentials")
        .where("userId", "==", uid)
        .where("deviceId", "==", device_id)
        .where("method", "==", method)
        .limit(1)
        .stream()
    )

    if existing:
        existing[0].reference.update({"isActive": False})

    return {"method": method, "isActive": False}
