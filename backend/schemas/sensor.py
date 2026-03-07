from pydantic import BaseModel
from typing import Optional


class SensorOut(BaseModel):
    id: str
    name: str
    type: str        # "Lock" | "Motion" | "Camera" | "Contact"
    status: str      # "active" | "inactive"
    battery: Optional[int] = None
    location: str
    lastUpdate: str


class SensorPatch(BaseModel):
    status: str      # "active" | "inactive"
