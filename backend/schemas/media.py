from pydantic import BaseModel
from datetime import datetime


class RecordingOut(BaseModel):
    id: str
    deviceId: str
    timestamp: datetime
    eventType: str
    mediaUrl: str
    duration: int | None = None
    thumbnail: str | None = None
