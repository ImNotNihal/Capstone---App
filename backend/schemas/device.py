from pydantic import BaseModel
from datetime import datetime


class DeviceStatus(BaseModel):
    deviceId: str
    status: str            # "LOCKED" | "UNLOCKED"
    isOnline: bool
    lastSeen: datetime | None = None


class DeviceOut(BaseModel):
    deviceId: str
    name: str
    status: str
    isOnline: bool
    ownerId: str
    lastSeen: datetime | None = None
    firmwareVersion: str | None = None


class CommandResult(BaseModel):
    success: bool
    message: str
    deviceId: str
    command: str           # "LOCK" | "UNLOCK"
    relayed: bool          # True if the command was forwarded to the ESP32 via WS
