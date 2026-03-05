from pydantic import BaseModel
from datetime import datetime
from typing import Any


class EventOut(BaseModel):
    id: str
    deviceId: str
    userId: str | None = None
    type: str
    timestamp: datetime
    metadata: dict[str, Any] = {}
    acknowledged: bool = False


class AlertOut(BaseModel):
    id: str
    userId: str
    deviceId: str
    type: str
    message: str
    read: bool
    timestamp: datetime
    severity: str          # "info" | "warning" | "danger"
