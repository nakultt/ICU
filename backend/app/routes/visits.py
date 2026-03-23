from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from ..models import Visit, Patient, User, MoodLog
from ..auth.deps import get_current_user, require_role

router = APIRouter(prefix="/api/visits", tags=["visits"])

class VisitCreate(BaseModel):
    patient_id: str
    scheduled_date: str  # YYYY-MM-DD
    scheduled_time: str   # HH:MM

class VisitResponse(BaseModel):
    id: str
    patient_id: str
    family_user_id: str
    scheduled_date: str
    scheduled_time: str
    status: str
    room_url: Optional[str]

@router.post("", response_model=VisitResponse)
async def create_visit(req: VisitCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    visit = Visit(
        patient_id=req.patient_id,
        family_user_id=user.id,
        scheduled_date=req.scheduled_date,
        scheduled_time=req.scheduled_time,
        status="pending"
    )
    db.add(visit)
    await db.commit()
    await db.refresh(visit)
    return visit

@router.get("", response_model=List[VisitResponse])
async def list_visits(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role in ("nurse", "admin"):
        result = await db.execute(select(Visit))
    else:
        # Family: show visits they created OR visits for any patient they're linked to
        from ..models import FamilyLink
        linked_patient_ids = select(FamilyLink.patient_id).where(FamilyLink.user_id == user.id)
        result = await db.execute(
            select(Visit).where(
                (Visit.family_user_id == user.id) | (Visit.patient_id.in_(linked_patient_ids))
            )
        )
    return result.scalars().all()

@router.get("/{visit_id}", response_model=VisitResponse)
async def get_visit(visit_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Visit).where(Visit.id == visit_id))
    visit = result.scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    return visit

import httpx
from ..config import settings

@router.patch("/{visit_id}/approve")
async def approve_visit(visit_id: str, db: AsyncSession = Depends(get_db), user: User = Depends(require_role("nurse"))):
    result = await db.execute(select(Visit).where(Visit.id == visit_id))
    visit = result.scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    # Try to create real Daily.co room if API key is present
    room_url = f"https://visicare.daily.co/demo-{visit.id[:8]}" # Default mock
    
    if settings.DAILY_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.daily.co/v1/rooms",
                    headers={"Authorization": f"Bearer {settings.DAILY_API_KEY}"},
                    json={
                        "name": f"visit-{visit.id[:12]}",
                        "properties": {
                            "exp": int(datetime.utcnow().timestamp()) + 3600, # 1 hour
                            "enable_screenshare": False,
                        }
                    },
                    timeout=10.0
                )
                if response.status_code in (200, 201):
                    room_url = response.json()["url"]
                elif response.status_code == 400 and "already exists" in response.text:
                    # If room already exists, just get the URL
                    room_url = f"https://visicare.daily.co/visit-{visit.id[:12]}"
        except Exception as e:
            print(f"Daily.co API error: {e}")
            # Fallback to mock

    visit.status = "approved"
    visit.room_url = room_url
    await db.commit()
    return {"status": "approved", "room_url": visit.room_url}

@router.post("/instant", response_model=VisitResponse)
async def create_instant_visit(patient_id: str = Body(..., embed=True), db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    from ..models import generate_uuid
    visit_id = generate_uuid()
    
    # Create an approved visit immediately
    visit = Visit(
        id=visit_id,
        patient_id=patient_id,
        family_user_id=user.id,
        scheduled_date=datetime.utcnow().strftime("%Y-%m-%d"),
        scheduled_time=datetime.utcnow().strftime("%H:%M"),
        status="approved"
    )
    
    # Generate room URL
    room_url = f"https://visicare.daily.co/instant-{visit_id[:8]}"
    
    if settings.DAILY_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.daily.co/v1/rooms",
                    headers={"Authorization": f"Bearer {settings.DAILY_API_KEY}"},
                    json={
                        "name": f"instant-{visit.id[:12]}",
                        "properties": {
                            "exp": int(datetime.utcnow().timestamp()) + 3600,
                            "enable_screenshare": False,
                        }
                    },
                    timeout=10.0
                )
                if response.status_code in (200, 201):
                    room_url = response.json()["url"]
        except Exception:
            pass

    visit.room_url = room_url
    db.add(visit)
    await db.commit()
    await db.refresh(visit)
    return visit

@router.post("/mood")
async def log_mood(visit_id: str = Body(...), score: int = Body(...), db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    log = MoodLog(
        visit_id=visit_id,
        user_id=user.id,
        respondent_type=user.role,
        mood_score=score
    )
    db.add(log)
    await db.commit()
    return {"status": "success"}
