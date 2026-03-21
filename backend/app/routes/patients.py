import random
import string
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
from ..database import get_db
from ..models import Patient, FamilyLink, User
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


def _patient_to_resp(p: Patient) -> PatientResponse:
    return PatientResponse(
        id=p.id, full_name=p.full_name, age=p.age, gender=p.gender,
        bed_number=p.bed_number, ward=p.ward, diagnosis=p.diagnosis,
        admission_date=p.admission_date.isoformat() if p.admission_date else "",
        is_conscious=p.is_conscious, current_status=p.current_status,
        status_note=p.status_note, is_active=p.is_active, access_code=p.access_code,
    )


@router.post("", response_model=PatientResponse)
async def create_patient(
    req: PatientCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("nurse", "admin")),
):
    patient = Patient(
        full_name=req.full_name, age=req.age, gender=req.gender,
        bed_number=req.bed_number, ward=req.ward, diagnosis=req.diagnosis,
        is_conscious=req.is_conscious, access_code=_gen_access_code(),
    )
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return _patient_to_resp(patient)


@router.get("", response_model=List[PatientResponse])
async def list_patients(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role in ("nurse", "admin"):
        result = await db.execute(select(Patient).where(Patient.is_active == True))
        return [_patient_to_resp(p) for p in result.scalars().all()]
    else:
        # Family: only linked patients
        result = await db.execute(
            select(Patient)
            .join(FamilyLink, FamilyLink.patient_id == Patient.id)
            .where(FamilyLink.user_id == user.id, Patient.is_active == True)
        )
        return [_patient_to_resp(p) for p in result.scalars().all()]


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return _patient_to_resp(patient)


@router.patch("/{patient_id}/status")
async def update_status(
    patient_id: str, req: StatusUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role("nurse", "admin")),
):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient.current_status = req.status
    patient.status_note = req.note
    patient.status_updated_at = datetime.utcnow()
    await db.commit()
    return {"status": "updated"}


@router.post("/link")
async def link_patient(
    req: LinkPatientRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Patient).where(Patient.access_code == req.access_code))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Invalid access code")

    # Check if already linked
    existing = await db.execute(
        select(FamilyLink).where(FamilyLink.user_id == user.id, FamilyLink.patient_id == patient.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already linked to this patient")

    link = FamilyLink(
        user_id=user.id, patient_id=patient.id,
        relation_type=req.relationship, is_next_of_kin=req.is_next_of_kin,
    )
    db.add(link)
    await db.commit()
    return {"status": "linked", "patient_id": patient.id, "patient_name": patient.full_name}
