import random
import string
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field
from typing import Optional, List
from ..database import get_db
from ..models import Patient, FamilyLink, User, generate_uuid
from ..auth.deps import get_current_user, require_role

router = APIRouter(prefix="/api/patients", tags=["patients"])

class PatientCreate(BaseModel):
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    bed_number: str
    ward: str = "ICU"
    diagnosis: str = ""
    is_conscious: bool = True

class PatientResponse(BaseModel):
    id: str
    full_name: str
    age: Optional[int]
    gender: Optional[str]
    bed_number: str
    ward: str
    diagnosis: str
    admission_date: str
    is_conscious: bool
    current_status: str
    status_note: str
    is_active: bool
    access_code: str

class StatusUpdate(BaseModel):
    status: str
    note: str = ""

class LinkPatientRequest(BaseModel):
    access_code: str
    relationship: str
    is_next_of_kin: bool = False

def _gen_access_code():
    return "".join(random.choices(string.digits, k=6))

def _patient_to_resp(p: dict) -> PatientResponse:
    adm_dt = p.get("admission_date")
    if isinstance(adm_dt, datetime):
        adm_iso = adm_dt.isoformat()
    elif isinstance(adm_dt, str):
        adm_iso = adm_dt
    else:
        adm_iso = ""
        
    return PatientResponse(
        id=p["_id"], full_name=p["full_name"], age=p.get("age"), gender=p.get("gender"),
        bed_number=p["bed_number"], ward=p["ward"], diagnosis=p.get("diagnosis", ""),
        admission_date=adm_iso,
        is_conscious=p.get("is_conscious", True), current_status=p.get("current_status", ""),
        status_note=p.get("status_note", ""), is_active=p.get("is_active", True), 
        access_code=p.get("access_code", ""),
    )

@router.post("", response_model=PatientResponse)
async def create_patient(
    req: PatientCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: User = Depends(require_role("nurse", "admin")),
):
    patient_data = {
        "_id": generate_uuid(),
        "full_name": req.full_name,
        "age": req.age,
        "gender": req.gender,
        "bed_number": req.bed_number,
        "ward": req.ward,
        "diagnosis": req.diagnosis,
        "is_conscious": req.is_conscious,
        "access_code": _gen_access_code(),
        "current_status": "STABLE",
        "status_note": "Condition stable",
        "admission_date": datetime.utcnow(),
        "status_updated_at": datetime.utcnow(),
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    await db.patients.insert_one(patient_data)
    return _patient_to_resp(patient_data)

@router.get("", response_model=List[PatientResponse])
async def list_patients(
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role in ("nurse", "admin"):
        cursor = db.patients.find({"is_active": True})
        patients = await cursor.to_list(length=100)
        return [_patient_to_resp(p) for p in patients]
    else:
        # Family: only linked patients
        links_cursor = db.family_links.find({"user_id": user.id})
        links = await links_cursor.to_list(length=100)
        patient_ids = [str(link["patient_id"]) for link in links]
        
        cursor = db.patients.find({"_id": {"$in": patient_ids}, "is_active": True})
        patients = await cursor.to_list(length=100)
        return [_patient_to_resp(p) for p in patients]

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str, db: AsyncIOMotorDatabase = Depends(get_db), user: User = Depends(get_current_user)):
    patient = await db.patients.find_one({"_id": patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return _patient_to_resp(patient)

@router.patch("/{patient_id}/status")
async def update_status(
    patient_id: str, req: StatusUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: User = Depends(require_role("nurse", "admin")),
):
    result = await db.patients.update_one(
        {"_id": patient_id},
        {"$set": {
            "current_status": req.status,
            "status_note": req.note,
            "status_updated_at": datetime.utcnow()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"status": "updated"}

@router.post("/link")
async def link_patient(
    req: LinkPatientRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: User = Depends(get_current_user),
):
    patient = await db.patients.find_one({"access_code": req.access_code})
    if not patient:
        raise HTTPException(status_code=404, detail="Invalid access code")

    existing = await db.family_links.find_one({"user_id": user.id, "patient_id": patient["_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Already linked to this patient")

    link_data = {
        "_id": generate_uuid(),
        "user_id": user.id,
        "patient_id": patient["_id"],
        "relation_type": req.relationship,
        "is_next_of_kin": req.is_next_of_kin,
        "is_verified": True,
        "created_at": datetime.utcnow()
    }
    await db.family_links.insert_one(link_data)
    return {"status": "linked", "patient_id": patient["_id"], "patient_name": patient["full_name"]}
