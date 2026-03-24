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
    status_updated_at: str
    is_active: bool
    access_code: str
    primary_unit: str
    latest_report: str
    nurse_note: str
    nurse_notes: str
    doctor_reports: List[dict]
    care_timeline: List[dict]

class StatusUpdate(BaseModel):
    status: str
    note: str = ""

class LinkPatientRequest(BaseModel):
    access_code: str
    relationship: str
    is_next_of_kin: bool = False

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    bed_number: Optional[str] = None
    ward: Optional[str] = None
    diagnosis: Optional[str] = None
    is_conscious: Optional[bool] = None
    current_status: Optional[str] = None
    status_note: Optional[str] = None
    primary_unit: Optional[str] = None
    latest_report: Optional[str] = None
    nurse_note: Optional[str] = None
    nurse_notes: Optional[str] = None
    doctor_reports: Optional[List[dict]] = None
    care_timeline: Optional[List[dict]] = None

def _gen_access_code():
    return "".join(random.choices(string.digits, k=6))

async def _gen_unique_access_code(db: AsyncIOMotorDatabase) -> str:
    for _ in range(20):
        code = _gen_access_code()
        existing = await db.patients.find_one({"access_code": code, "is_active": True})
        if not existing:
            return code
    raise HTTPException(status_code=500, detail="Unable to generate unique access code")

def _patient_to_resp(p: dict) -> PatientResponse:
    adm_dt = p.get("admission_date")
    status_dt = p.get("status_updated_at")
    if isinstance(adm_dt, datetime):
        adm_iso = adm_dt.isoformat()
    elif isinstance(adm_dt, str):
        adm_iso = adm_dt
    else:
        adm_iso = ""

    if isinstance(status_dt, datetime):
        status_iso = status_dt.isoformat()
    elif isinstance(status_dt, str):
        status_iso = status_dt
    else:
        status_iso = ""
        
    return PatientResponse(
        id=p["_id"], full_name=p["full_name"], age=p.get("age"), gender=p.get("gender"),
        bed_number=p["bed_number"], ward=p["ward"], diagnosis=p.get("diagnosis", ""),
        admission_date=adm_iso,
        is_conscious=p.get("is_conscious", True), current_status=p.get("current_status", ""),
        status_note=p.get("status_note", ""), status_updated_at=status_iso, is_active=p.get("is_active", True),
        access_code=p.get("access_code", ""),
        primary_unit=p.get("primary_unit", "Critical Care"),
        latest_report=p.get("latest_report", ""),
        nurse_note=p.get("nurse_note", ""),
        nurse_notes=p.get("nurse_notes", ""),
        doctor_reports=p.get("doctor_reports", []),
        care_timeline=p.get("care_timeline", []),
    )

@router.post("", response_model=PatientResponse)
async def create_patient(
    req: PatientCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: User = Depends(require_role("nurse", "admin")),
):
    access_code = await _gen_unique_access_code(db)
    patient_data = {
        "_id": generate_uuid(),
        "full_name": req.full_name,
        "age": req.age,
        "gender": req.gender,
        "bed_number": req.bed_number,
        "ward": req.ward,
        "diagnosis": req.diagnosis,
        "is_conscious": req.is_conscious,
        "access_code": access_code,
        "current_status": "STABLE",
        "status_note": "Condition stable",
        "primary_unit": "Critical Care",
        "latest_report": "Clinical response stable",
        "nurse_note": "Continue monitored support.",
        "nurse_notes": "Patient under regular ICU monitoring.",
        "doctor_reports": [],
        "care_timeline": [],
        "admission_date": datetime.utcnow(),
        "status_updated_at": datetime.utcnow(),
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    await db.patients.insert_one(patient_data)
    return _patient_to_resp(patient_data)

@router.patch("/{patient_id}/access-code", response_model=PatientResponse)
async def regenerate_access_code(
    patient_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: User = Depends(require_role("nurse", "admin")),
):
    patient = await db.patients.find_one({"_id": patient_id, "is_active": True})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    new_code = await _gen_unique_access_code(db)
    await db.patients.update_one(
        {"_id": patient_id, "is_active": True},
        {"$set": {"access_code": new_code, "status_updated_at": datetime.utcnow()}}
    )

    updated = await db.patients.find_one({"_id": patient_id, "is_active": True})
    if not updated:
        raise HTTPException(status_code=404, detail="Patient not found")
    return _patient_to_resp(updated)

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
    patient = await db.patients.find_one({"_id": patient_id, "is_active": True})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if user.role not in ("nurse", "admin"):
                link = await db.family_links.find_one({"user_id": user.id, "patient_id": patient_id})
                if not link:
                        raise HTTPException(status_code=403, detail="Not authorized to view this patient")
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

@router.patch("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str,
    req: PatientUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: User = Depends(require_role("nurse", "admin")),
):
    updates = {k: v for k, v in req.model_dump(exclude_unset=True).items()}
    if not updates:
        patient = await db.patients.find_one({"_id": patient_id, "is_active": True})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        return _patient_to_resp(patient)

    updates["status_updated_at"] = datetime.utcnow()
    result = await db.patients.update_one(
        {"_id": patient_id, "is_active": True},
        {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient = await db.patients.find_one({"_id": patient_id, "is_active": True})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return _patient_to_resp(patient)

@router.delete("/{patient_id}")
async def remove_patient(
    patient_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: User = Depends(require_role("nurse", "admin")),
):
    result = await db.patients.update_one(
        {"_id": patient_id, "is_active": True},
        {"$set": {"is_active": False, "status_updated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"status": "removed"}

@router.post("/link")
async def link_patient(
    req: LinkPatientRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: User = Depends(get_current_user),
):
    identifier = req.access_code.strip()
    patient = await db.patients.find_one({
        "$or": [
            {"access_code": identifier},
            {"_id": identifier}
        ]
    })
    if not patient:
        raise HTTPException(status_code=404, detail="Invalid patient ID or access code")

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
