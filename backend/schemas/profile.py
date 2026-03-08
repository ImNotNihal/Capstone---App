from pydantic import BaseModel, EmailStr
from typing import Optional


class FingerprintProfile(BaseModel):
    label: str


class FaceProfile(BaseModel):
    name: str
    accessLevel: str = "Resident"   # Admin | Resident | Scheduled Access
    scheduleDetails: Optional[str] = None


class PinCode(BaseModel):
    label: str
    code: str
    pinType: str = "permanent"      # permanent | otp


class InviteRequest(BaseModel):
    email: str
    role: str = "guest"
