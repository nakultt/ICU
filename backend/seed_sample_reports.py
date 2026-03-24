from __future__ import annotations

from datetime import datetime, timedelta, UTC

from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings


def build_reports(now: datetime, patient_name: str) -> list[dict]:
    return [
        {
            "id": f"rep-{patient_name.lower().replace(' ', '-')}-1",
            "time": (now - timedelta(hours=18)).isoformat(),
            "doctor": "Dr. Arjun Sen",
            "title": "Early Morning ICU Assessment",
            "summary": "Initial overnight review completed. Hemodynamics acceptable with no acute deterioration.",
            "fileName": "icu_assessment_morning.pdf",
            "createdAt": (now - timedelta(hours=18)).isoformat(),
        },
        {
            "id": f"rep-{patient_name.lower().replace(' ', '-')}-2",
            "time": (now - timedelta(hours=8)).isoformat(),
            "doctor": "Dr. Priyanka Rao",
            "title": "Midday Clinical Progress",
            "summary": "Reviewed medication response and respiratory parameters. Continue current protocol.",
            "fileName": "clinical_progress_midday.pdf",
            "createdAt": (now - timedelta(hours=8)).isoformat(),
        },
        {
            "id": f"rep-{patient_name.lower().replace(' ', '-')}-3",
            "time": (now - timedelta(hours=1)).isoformat(),
            "doctor": "Dr. Arjun Sen",
            "title": "Evening Consultant Note",
            "summary": "Patient status re-evaluated. Continue 2-hour vitals charting and maintain medication schedule.",
            "fileName": "consultant_evening_note.pdf",
            "createdAt": (now - timedelta(hours=1)).isoformat(),
        },
    ]


async def seed_reports() -> None:
    now = datetime.now(UTC)
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client.get_database()

    patients = await db.patients.find({"is_active": True}).to_list(length=200)

    updated = 0
    for patient in patients:
        reports = build_reports(now, patient.get("full_name", "patient"))
        latest_report = reports[-1]["summary"]

        await db.patients.update_one(
            {"_id": patient["_id"]},
            {
                "$set": {
                    "doctor_reports": reports,
                    "latest_report": latest_report,
                    "nurse_note": "Sample report pack attached and communicated to family portal.",
                    "nurse_notes": "Daily notes synchronized with doctor reports.",
                    "status_updated_at": now,
                    "sample_reports_seeded": True,
                }
            },
        )
        updated += 1

    client.close()
    print(f"Sample reports seed complete: updated={updated}")


if __name__ == "__main__":
    import asyncio

    asyncio.run(seed_reports())
