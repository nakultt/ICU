from fastapi import APIRouter, Depends, HTTPException, Body
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import httpx
from ..database import get_db
from ..models import Visit, Patient, User, MoodLog, generate_uuid
from ..config import settings
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
    shared_access_code: Optional[str]

def _visit_to_resp(v: dict) -> VisitResponse:
    return VisitResponse(
        id=v["_id"], patient_id=str(v["patient_id"]), family_user_id=str(v["family_user_id"]),
        scheduled_date=v["scheduled_date"], scheduled_time=v["scheduled_time"],
        status=v["status"], room_url=v.get("room_url", ""), shared_access_code=v.get("shared_access_code", "")
    )

@router.post("", response_model=VisitResponse)
async def create_visit(req: VisitCreate, db: AsyncIOMotorDatabase = Depends(get_db), user: User = Depends(get_current_user)):
    visit_data = {
        "_id": generate_uuid(),
        "patient_id": req.patient_id,
        "family_user_id": user.id,
        "scheduled_date": req.scheduled_date,
        "scheduled_time": req.scheduled_time,
        "duration_minutes": 15,
        "status": "pending",
        "decline_reason": "",
        "approved_by": None,
        "shared_access_code": "",
        "room_name": "",
        "room_url": "",
        "created_at": datetime.utcnow()
    }
    await db.visits.insert_one(visit_data)
    return _visit_to_resp(visit_data)

@router.get("", response_model=List[VisitResponse])
async def list_visits(db: AsyncIOMotorDatabase = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role in ("nurse", "admin"):
        cursor = db.visits.find()
        visits = await cursor.to_list(length=100)
    else:
        # Family: show visits they created OR visits for any patient they're linked to
        links_cursor = db.family_links.find({"user_id": user.id})
        links = await links_cursor.to_list(length=100)
        linked_patient_ids = [str(link["patient_id"]) for link in links]
        
        cursor = db.visits.find({
            "$or": [
                {"family_user_id": user.id},
                {"patient_id": {"$in": linked_patient_ids}}
            ]
        })
        visits = await cursor.to_list(length=100)
        
    return [_visit_to_resp(v) for v in visits]

@router.get("/{visit_id}", response_model=VisitResponse)
async def get_visit(visit_id: str, db: AsyncIOMotorDatabase = Depends(get_db), user: User = Depends(get_current_user)):
    visit = await db.visits.find_one({"_id": visit_id})
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    return _visit_to_resp(visit)

@router.patch("/{visit_id}/approve")
async def approve_visit(visit_id: str, db: AsyncIOMotorDatabase = Depends(get_db), user: User = Depends(require_role("nurse"))):
    visit = await db.visits.find_one({"_id": visit_id})
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    patient = await db.patients.find_one({"_id": visit["patient_id"]})
    
    room_url = f"https://visicare.daily.co/demo-{visit_id[:8]}" # Default mock
    
    if settings.DAILY_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.daily.co/v1/rooms",
                    headers={"Authorization": f"Bearer {settings.DAILY_API_KEY}"},
                    json={
                        "name": f"visit-{visit_id[:12]}",
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
                    room_url = f"https://visicare.daily.co/visit-{visit_id[:12]}"
        except Exception as e:
            print(f"Daily.co API error: {e}")
            # Fallback to mock

    await db.visits.update_one(
        {"_id": visit_id},
        {"$set": {
            "status": "approved",
            "room_url": room_url,
            "approved_by": user.id,
            "shared_access_code": (patient or {}).get("access_code", "")
        }}
    )
    return {"status": "approved", "room_url": room_url, "shared_access_code": (patient or {}).get("access_code", "")}

@router.post("/instant", response_model=VisitResponse)
async def create_instant_visit(patient_id: str = Body(..., embed=True), db: AsyncIOMotorDatabase = Depends(get_db), user: User = Depends(get_current_user)):
    existing_visit = await db.visits.find_one({
        "patient_id": patient_id, 
        "status": "approved"
    })
    
    if existing_visit:
        return _visit_to_resp(existing_visit)

    visit_id = generate_uuid()
    visit_data = {
        "_id": visit_id,
        "patient_id": patient_id,
        "family_user_id": user.id,
        "scheduled_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "scheduled_time": datetime.utcnow().strftime("%H:%M"),
        "status": "approved",
        "room_url": "",
        "shared_access_code": "",
        "duration_minutes": 15,
        "decline_reason": "",
        "approved_by": user.id,
        "room_name": "",
        "created_at": datetime.utcnow()
    }
    await db.visits.insert_one(visit_data)
    return _visit_to_resp(visit_data)

@router.patch("/{visit_id}/complete")
async def complete_visit(visit_id: str, db: AsyncIOMotorDatabase = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.visits.update_one(
        {"_id": visit_id},
        {"$set": {"status": "completed"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Visit not found")
    return {"status": "completed"}

@router.post("/mood")
async def log_mood(visit_id: str = Body(...), score: int = Body(...), db: AsyncIOMotorDatabase = Depends(get_db), user: User = Depends(get_current_user)):
    log_data = {
        "_id": generate_uuid(),
        "visit_id": visit_id,
        "user_id": user.id,
        "respondent_type": user.role,
        "mood_score": score,
        "mood_emoji": "",
        "felt_connected": "",
        "comment": "",
        "created_at": datetime.utcnow()
    }
    await db.mood_logs.insert_one(log_data)
    return {"status": "success"}
