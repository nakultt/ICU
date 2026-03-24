from __future__ import annotations

import random
from datetime import datetime, timedelta, UTC

from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings


SAMPLE_PATIENTS = [
    {
        "full_name": "Aarav Sharma",
        "age": 67,
        "gender": "Male",
        "bed_number": "ICU-01",
        "ward": "ICU",
        "diagnosis": "Post-operative cardiac monitoring",
        "current_status": "STABLE",
    },
    {
        "full_name": "Meera Nair",
        "age": 54,
        "gender": "Female",
        "bed_number": "ICU-02",
        "ward": "ICU",
        "diagnosis": "Severe pneumonia with respiratory support",
        "current_status": "CRITICAL",
    },
    {
        "full_name": "Rohan Verma",
        "age": 39,
        "gender": "Male",
        "bed_number": "ICU-03",
        "ward": "ICU",
        "diagnosis": "Sepsis observation",
        "current_status": "STABLE",
    },
    {
        "full_name": "Lakshmi Iyer",
        "age": 72,
        "gender": "Female",
        "bed_number": "ICU-04",
        "ward": "ICU",
        "diagnosis": "Stroke recovery and neuro monitoring",
        "current_status": "STABLE",
    },
    {
        "full_name": "Nikhil Rao",
        "age": 61,
        "gender": "Male",
        "bed_number": "ICU-05",
        "ward": "ICU",
        "diagnosis": "Acute kidney injury",
        "current_status": "CRITICAL",
    },
    {
        "full_name": "Farah Khan",
        "age": 46,
        "gender": "Female",
        "bed_number": "ICU-06",
        "ward": "ICU",
        "diagnosis": "Post-seizure stabilization",
        "current_status": "STABLE",
    },
    {
        "full_name": "Vikram Singh",
        "age": 58,
        "gender": "Male",
        "bed_number": "ICU-07",
        "ward": "ICU",
        "diagnosis": "COPD exacerbation",
        "current_status": "CRITICAL",
    },
    {
        "full_name": "Ananya Das",
        "age": 29,
        "gender": "Female",
        "bed_number": "ICU-08",
        "ward": "ICU",
        "diagnosis": "Post-trauma observation",
        "current_status": "STABLE",
    },
    {
        "full_name": "Prakash Menon",
        "age": 64,
        "gender": "Male",
        "bed_number": "ICU-09",
        "ward": "ICU",
        "diagnosis": "Cardiac arrhythmia monitoring",
        "current_status": "STABLE",
    },
    {
        "full_name": "Sana Ali",
        "age": 51,
        "gender": "Female",
        "bed_number": "ICU-10",
        "ward": "ICU",
        "diagnosis": "High-risk diabetic ketoacidosis recovery",
        "current_status": "CRITICAL",
    },
]


def _now() -> datetime:
    return datetime.now(UTC)


async def _unique_access_code(db) -> str:
    for _ in range(30):
        code = "".join(str(random.randint(0, 9)) for _ in range(6))
        exists = await db.patients.find_one({"access_code": code, "is_active": True})
        if not exists:
            return code
    raise RuntimeError("Could not generate unique access code")


async def seed() -> None:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client.get_database()

    inserted = 0
    updated = 0

    for i, patient in enumerate(SAMPLE_PATIENTS, start=1):
        now = _now()
        admission = now - timedelta(days=(12 - i))

        base_care_timeline = [
            {
                "time": (now - timedelta(hours=8)).isoformat(),
                "title": "Morning assessment",
                "detail": "Vitals monitored and airway checked.",
                "by": "Nurse Priya",
            },
            {
                "time": (now - timedelta(hours=4)).isoformat(),
                "title": "Glucose adjustment",
                "detail": "Adjusted glucose support and documented response.",
                "by": "Nurse Priya",
            },
            {
                "time": (now - timedelta(hours=2)).isoformat(),
                "title": "Medication update",
                "detail": "Paracetamol and Cetirizine administered as prescribed.",
                "by": "Nurse Priya",
            },
            {
                "time": (now - timedelta(minutes=35)).isoformat(),
                "title": "Injection administered",
                "detail": "Insulin injection given, follow-up observation ongoing.",
                "by": "Nurse Priya",
            },
        ]

        base_doctor_reports = [
            {
                "time": (now - timedelta(hours=6)).isoformat(),
                "doctor": "Dr. Arjun Sen",
                "title": "ICU review",
                "summary": "Hemodynamics under observation; continue current line of treatment.",
            },
            {
                "time": (now - timedelta(hours=1)).isoformat(),
                "doctor": "Dr. Arjun Sen",
                "title": "Follow-up note",
                "summary": "Condition reviewed; maintain 2-hour interval vitals update.",
            },
        ]

        query = {"full_name": patient["full_name"], "bed_number": patient["bed_number"], "is_active": True}
        existing = await db.patients.find_one(query)

        access_code = existing.get("access_code") if existing else await _unique_access_code(db)

        payload = {
            **patient,
            "is_conscious": True,
            "status_note": "Patient monitored under ICU protocol",
            "status_updated_at": now,
            "admission_date": admission,
            "is_active": True,
            "access_code": access_code,
            "primary_unit": "Critical Care",
            "latest_report": "Daily ICU report generated and shared with family.",
            "nurse_note": "Vitals updated and communicated to care team.",
            "nurse_notes": "Regular reassessment done; medication and glucose adjustments logged.",
            "doctor_reports": base_doctor_reports,
            "care_timeline": base_care_timeline,
            "created_at": existing.get("created_at", now) if existing else now,
            "seed_version": "v2-monitoring",
        }

        if existing:
            await db.patients.update_one({"_id": existing["_id"]}, {"$set": payload})
            updated += 1
        else:
            payload["_id"] = f"seed-patient-{i:02d}"
            await db.patients.insert_one(payload)
            inserted += 1

    client.close()
    print(f"Seed complete: inserted={inserted}, updated={updated}, total={len(SAMPLE_PATIENTS)}")


if __name__ == "__main__":
    import asyncio

    asyncio.run(seed())
