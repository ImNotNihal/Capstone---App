"""
FastAPI dependency that validates the Authorization: Bearer <token> header
and injects the current Firestore user document as a plain dict.

Usage in a route:
    @router.get("/me")
    async def me(current_user: dict = Depends(get_current_user)):
        ...
"""

import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from db.firebase import db
from services.auth_service import get_uid_from_token
from jose import JWTError

logger = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=True)

_CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    """
    Validate the Bearer token and return the Firestore user document.
    Raises HTTP 401 if the token is invalid or the user no longer exists.
    """
    try:
        uid = get_uid_from_token(creds.credentials)
    except JWTError as exc:
        logger.debug("JWT validation failed: %s", exc)
        raise _CREDENTIALS_EXCEPTION

    user_doc = db.collection("users").document(uid).get()
    if not user_doc.exists:
        raise _CREDENTIALS_EXCEPTION

    return {"uid": uid, **user_doc.to_dict()}


async def require_device_owner(
    device_id: str,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Assert that the authenticated user owns the requested device.
    Used by device-control routes to prevent cross-user access.
    """
    user_device = current_user.get("deviceId") or ""
    user_devices = current_user.get("deviceIds") or [user_device]

    if device_id not in user_devices:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to control this device.",
        )
    return current_user
