import uuid
from fastapi import APIRouter, Depends, Path
from middleware.auth import get_current_user
from db.firebase import db
from pydantic import BaseModel
from typing import Optional

router = APIRouter(tags=["pins"])

class PinCreate(BaseModel):
    label: str
    code: str
    pinType: str = "permanent"
    expires: Optional[str] = None

class PinOut(BaseModel):
    id: str
    label: str
    code: str
    pinType: str
    strength: str
    expires: Optional[str] = None

@router.get("/devices/{device_id}/pins", response_model=list[PinOut])
async def get_pins(device_id: str = Path(...), current_user: dict = Depends(get_current_user)):
    docs = db.collection("devices").document(device_id).collection("pins").stream()
    result = []
    for doc in docs:
        d = doc.to_dict()
        result.append(PinOut(id=doc.id, **d))
    return result

@router.post("/devices/{device_id}/pins", response_model=PinOut)
async def create_pin(body: PinCreate, device_id: str = Path(...), current_user: dict = Depends(get_current_user)):
    pin_id = str(uuid.uuid4())
    strength = "Strong" if len(body.code) >= 6 else "Moderate"
    
    pin_data = {
        "label": body.label,
        "code": body.code,
        "pinType": body.pinType,
        "strength": strength,
        "expires": body.expires
    }
    
    db.collection("devices").document(device_id).collection("pins").document(pin_id).set(pin_data)
    
    return PinOut(id=pin_id, **pin_data)

@router.delete("/devices/{device_id}/pins/{pin_id}")
async def delete_pin(device_id: str = Path(...), pin_id: str = Path(...), current_user: dict = Depends(get_current_user)):
    db.collection("devices").document(device_id).collection("pins").document(pin_id).delete()
    return {"success": True}