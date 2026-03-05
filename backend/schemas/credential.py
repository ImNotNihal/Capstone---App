from pydantic import BaseModel
from datetime import datetime
from typing import Any

VALID_METHODS = {"face", "fingerprint", "keypad", "bluetooth"}


class CredentialEnrollRequest(BaseModel):
    method: str        # face | fingerprint | keypad | bluetooth
    data: dict[str, Any] = {}    # method-specific payload


class CredentialOut(BaseModel):
    id: str
    userId: str
    deviceId: str
    method: str
    isActive: bool
    enrolledAt: datetime


class CredentialStateOut(BaseModel):
    """Compact credential map returned by GET /credentials/me."""
    authMethods: dict[str, dict]   # method → {isActive: bool, enrolledAt: ...}
