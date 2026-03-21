import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from .database import Base


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'nurse', 'family', 'admin'
    phone = Column(String, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, default=generate_uuid)
    full_name = Column(String, nullable=False)
    age = Column(Integer)
    gender = Column(String)
    bed_number = Column(String, nullable=False)
    ward = Column(String, default="ICU")
    diagnosis = Column(String, default="")
    admission_date = Column(DateTime, default=datetime.utcnow)
    is_conscious = Column(Boolean, default=True)
    current_status = Column(String, default="STABLE")
    status_note = Column(String, default="Condition stable")
    status_updated_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    access_code = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    family_members = relationship("FamilyLink", back_populates="patient")
    visits = relationship("Visit", back_populates="patient")


class FamilyLink(Base):
    __tablename__ = "family_links"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    relation_type = Column(String, nullable=False)
    is_next_of_kin = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    patient = relationship("Patient", back_populates="family_members")


class Visit(Base):
    __tablename__ = "visits"

    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    family_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    scheduled_date = Column(String, nullable=False)  # YYYY-MM-DD
    scheduled_time = Column(String, nullable=False)   # HH:MM
    duration_minutes = Column(Integer, default=15)
    status = Column(String, default="pending")  # pending, approved, declined, completed, cancelled
    decline_reason = Column(String, default="")
    approved_by = Column(String, ForeignKey("users.id"), nullable=True)
    room_name = Column(String, default="")
    room_url = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="visits")
    family_user = relationship("User", foreign_keys=[family_user_id])


class MoodLog(Base):
    __tablename__ = "mood_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    visit_id = Column(String, ForeignKey("visits.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    respondent_type = Column(String, nullable=False)  # 'patient' or 'family'
    mood_score = Column(Integer, nullable=False)  # 1-5
    mood_emoji = Column(String, default="")
    felt_connected = Column(String, default="")
    comment = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class AsyncMessage(Base):
    __tablename__ = "async_messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    family_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    message_type = Column(String, default="text")  # text, voice, video
    content = Column(Text, default="")
    status = Column(String, default="pending")  # pending, approved, delivered, rejected
    reviewed_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=True)
    action = Column(String, nullable=False)
    resource_type = Column(String, default="")
    resource_id = Column(String, default="")
    details = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
