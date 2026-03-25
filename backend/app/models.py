import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List

def generate_uuid() -> str:
    return str(uuid.uuid4())

class MongoBaseModel(BaseModel):
    id: str = Field(default_factory=generate_uuid, alias="_id")

    class Config:
        populate_by_name = True

class User(MongoBaseModel):
    email: EmailStr
    hashed_password: str
    full_name: str
    role: str # 'nurse', 'family', 'admin'
    phone: str = ""
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Patient(MongoBaseModel):
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    bed_number: str
    ward: str = "ICU"
    diagnosis: str = ""
    admission_date: datetime = Field(default_factory=datetime.utcnow)
    is_conscious: bool = True
    current_status: str = "STABLE"
    status_note: str = "Condition stable"
    status_updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    access_code: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FamilyLink(MongoBaseModel):
    user_id: str
    patient_id: str
    relation_type: str
    is_next_of_kin: bool = False
    is_verified: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Visit(MongoBaseModel):
    patient_id: str
    family_user_id: str
    scheduled_date: str
    scheduled_time: str
    duration_minutes: int = 15
    status: str = "pending" # pending, approved, declined, completed, cancelled
    decline_reason: str = ""
    approved_by: Optional[str] = None
    room_name: str = ""
    room_url: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MoodLog(MongoBaseModel):
    visit_id: str
    user_id: str
    respondent_type: str
    mood_score: int
    mood_emoji: str = ""
    felt_connected: str = ""
    comment: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AsyncMessage(MongoBaseModel):
    patient_id: str
    family_user_id: str
    message_type: str = "text"
    content: str = ""
    status: str = "pending"
    reviewed_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AuditLog(MongoBaseModel):
    user_id: Optional[str] = None
    action: str
    resource_type: str = ""
    resource_id: str = ""
    details: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PatientDocumentChunk(MongoBaseModel):
    patient_id: str
    chunk_text: str
    embedding: List[float]
    metadata: dict = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)

