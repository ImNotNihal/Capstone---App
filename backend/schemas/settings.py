from pydantic import BaseModel, Field


class DeviceSettings(BaseModel):
    autoLock: bool = True
    autoLockTimeout: int = Field(default=30, ge=5, le=3600)   # seconds
    failedAttemptLimit: int = Field(default=5, ge=1, le=20)
    alertsEnabled: bool = True
    motionSensitivity: str = "medium"                          # low | medium | high
    cameraEnabled: bool = True


class SettingsOut(DeviceSettings):
    deviceId: str
