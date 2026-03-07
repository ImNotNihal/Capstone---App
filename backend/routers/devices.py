"""
Device control routes.

POST /devices/{device_id}/lock         – send LOCK command
POST /devices/{device_id}/unlock       – send UNLOCK command
GET  /devices/{device_id}/status       – current lock state
GET  /send-command/{device_id}/{cmd}   – alias used by the current mobile app
POST /send-command/{device_id}/{cmd}   – alias used by the current mobile app
GET  /status/{device_id}              – alias used by the current mobile app
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Path, status

from middleware.auth import get_current_user, require_device_owner
from schemas.device import CommandResult, DeviceStatus
from services.device_service import get_device_status, set_lock_status
from services.event_service import log_event
from ws.manager import manager

logger = logging.getLogger(__name__)
router = APIRouter(tags=["devices"])


# ─── Internal command handler ─────────────────────────────────────────────────

async def _send_command(
    device_id: str,
    command: str,          # "LOCK" | "UNLOCK"
    user_id: str,
) -> CommandResult:
    relayed = await manager.relay_to_device(device_id, {
        "type": "command",
        "command": command,
    })

    new_status = "LOCKED" if command == "LOCK" else "UNLOCKED"

    if not relayed:
        # Device offline → update Firestore optimistically so the app still
        # shows the correct status and syncs when the device reconnects.
        logger.warning("Device %s offline; command %s applied optimistically", device_id, command)
        set_lock_status(device_id, new_status)

    await manager.broadcast_status(device_id, new_status)
    await log_event(device_id, new_status, user_id=user_id)

    return CommandResult(
        success=True,
        message=f"{'Lock' if command == 'LOCK' else 'Unlock'} command sent.",
        deviceId=device_id,
        command=command,
        relayed=relayed,
    )


# ─── RESTful routes ───────────────────────────────────────────────────────────

@router.post(
    "/devices/{device_id}/lock",
    response_model=CommandResult,
    summary="Lock the device",
)
async def lock_device(
    device_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    return await _send_command(device_id, "LOCK", current_user["uid"])


@router.post(
    "/devices/{device_id}/unlock",
    response_model=CommandResult,
    summary="Unlock the device",
)
async def unlock_device(
    device_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    return await _send_command(device_id, "UNLOCK", current_user["uid"])


@router.get(
    "/devices/{device_id}/status",
    response_model=DeviceStatus,
    summary="Get current lock status",
)
async def device_status(
    device_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    data = get_device_status(device_id)
    data["isOnline"] = manager.device_is_online(device_id)
    return DeviceStatus(**data)


# ─── Aliases matching the current mobile app's URL patterns ──────────────────
# The app calls:
#   POST /send-command/{device_id}/LOCK
#   POST /send-command/{device_id}/UNLOCK
#   GET  /status/{device_id}

@router.post(
    "/send-command/{device_id}/{command}",
    response_model=CommandResult,
    summary="Send a LOCK or UNLOCK command (mobile app alias)",
)
async def send_command_alias(
    device_id: str = Path(...),
    command: str = Path(..., pattern="^(LOCK|UNLOCK)$"),
    current_user: dict = Depends(get_current_user),
):
    return await _send_command(device_id, command.upper(), current_user["uid"])


@router.get(
    "/status/{device_id}",
    summary="Get current status (mobile app alias)",
)
async def status_alias(
    device_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    data = get_device_status(device_id)
    data["isOnline"] = manager.device_is_online(device_id)
    return data


@router.get(
    "/devices/{device_id}/info",
    summary="Get device metadata and current user's role",
)
async def device_info(
    device_id: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    from services.device_service import get_device
    data = get_device(device_id)
    if not data:
        raise HTTPException(status_code=404, detail="Device not found.")
    owner_id = data.get("ownerId")
    role = "owner" if current_user["uid"] == owner_id else "guest"
    return {
        "deviceId": device_id,
        "name": data.get("name"),
        "ownerId": owner_id,
        "role": role,
    }
