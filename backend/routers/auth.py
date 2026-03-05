"""
Authentication routes.

POST /auth/register   – create a new user account
POST /auth/login      – sign in, receive JWT pair
GET  /auth/me         – return the authenticated user's profile
POST /auth/refresh    – exchange refresh token for a new access token
POST /auth/logout     – update FCM token / clean up (stateless JWT, client discards token)
"""

import uuid
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from db.firebase import db
from middleware.auth import get_current_user
from schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut, RefreshRequest
from services.auth_service import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    decode_token,
)
from jose import JWTError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


# ─── Register ────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest):
    # Check email uniqueness
    existing = (
        db.collection("users")
        .where("email", "==", body.email)
        .limit(1)
        .stream()
    )
    if any(True for _ in existing):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    uid = str(uuid.uuid4())
    hashed = hash_password(body.password)

    user_doc = {
        "email": body.email,
        "firstName": body.firstName,
        "lastName": body.lastName,
        "hashedPassword": hashed,
        "deviceId": body.deviceId,
        "deviceIds": [body.deviceId] if body.deviceId else [],
        "fcmToken": body.fcmToken,
        "role": "owner",
        "createdAt": datetime.now(timezone.utc),
    }

    db.collection("users").document(uid).set(user_doc)

    # Provision default device settings if a deviceId was supplied
    if body.deviceId:
        _ensure_device(body.deviceId, uid)

    logger.info("New user registered: %s (%s)", uid, body.email)

    return TokenResponse(
        access_token=create_access_token(uid),
        refresh_token=create_refresh_token(uid),
    )


# ─── Login ────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    # Look up by email
    docs = list(
        db.collection("users")
        .where("email", "==", body.email)
        .limit(1)
        .stream()
    )
    if not docs:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid credentials.")

    user_doc = docs[0]
    user_data = user_doc.to_dict()

    if not verify_password(body.password, user_data.get("hashedPassword", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid credentials.")

    uid = user_doc.id
    logger.info("User logged in: %s", uid)

    return TokenResponse(
        access_token=create_access_token(uid),
        refresh_token=create_refresh_token(uid),
    )


# ─── Me ───────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    return UserOut(
        uid=current_user["uid"],
        email=current_user.get("email", ""),
        firstName=current_user.get("firstName", ""),
        lastName=current_user.get("lastName", ""),
        deviceId=current_user.get("deviceId"),
        role=current_user.get("role", "owner"),
    )


# ─── Refresh ─────────────────────────────────────────────────────────────────

@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest):
    try:
        payload = decode_token(body.refresh_token)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid or expired refresh token.")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Token is not a refresh token.")

    uid: str = payload.get("sub", "")
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid refresh token.")

    return TokenResponse(
        access_token=create_access_token(uid),
        refresh_token=create_refresh_token(uid),
    )


# ─── FCM token update (called by mobile on login / foreground) ───────────────

@router.post("/fcm-token", status_code=status.HTTP_204_NO_CONTENT)
async def update_fcm_token(
    body: dict,
    current_user: dict = Depends(get_current_user),
):
    token = body.get("fcmToken")
    if not token:
        raise HTTPException(status_code=400, detail="fcmToken is required.")
    db.collection("users").document(current_user["uid"]).update({"fcmToken": token})


# ─── Internal helpers ─────────────────────────────────────────────────────────

def _ensure_device(device_id: str, owner_id: str) -> None:
    """Create device + default settings documents if they do not exist."""
    device_ref = db.collection("devices").document(device_id)
    if not device_ref.get().exists:
        device_ref.set({
            "name": f"Smart Lock {device_id[-6:]}",
            "status": "LOCKED",
            "isOnline": False,
            "ownerId": owner_id,
            "lastSeen": None,
            "firmwareVersion": None,
            "createdAt": datetime.now(timezone.utc),
        })

    settings_ref = db.collection("settings").document(device_id)
    if not settings_ref.get().exists:
        settings_ref.set({
            "autoLock": True,
            "autoLockTimeout": 30,
            "failedAttemptLimit": 5,
            "alertsEnabled": True,
            "motionSensitivity": "medium",
            "cameraEnabled": True,
            "updatedAt": datetime.now(timezone.utc),
        })
