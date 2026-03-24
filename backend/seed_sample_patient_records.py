from __future__ import annotations

from datetime import UTC, datetime, timedelta
from random import randint, uniform

from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings


DOCTORS = [
    ("Dr. Arjun Sen", "Consultant Intensivist"),
    ("Dr. Priyanka Rao", "Critical Care Specialist"),
    ("Dr. Neha Iqbal", "Pulmonary Consultant"),
]

NURSES = ["Nurse Priya", "Nurse Kavya", "Nurse Rahul", "Nurse Sahana"]


def iso(dt: datetime) -> str:
    return dt.astimezone(UTC).isoformat()


def make_monitoring_log(patient_id: str, patient_name: str, index: int, base_time: datetime) -> dict:
    doctor_name, doctor_title = DOCTORS[index % len(DOCTORS)]
    nurse_name = NURSES[index % len(NURSES)]

    hr = 72 + randint(-8, 16)
    bp_sys = 118 + randint(-12, 20)
    bp_dia = 76 + randint(-10, 14)
    temp = round(98.4 + uniform(-1.1, 2.4), 1)
    sugar = 108 + randint(-25, 70)
    oxygen = 97 + randint(-5, 2)

    created = base_time - timedelta(hours=(index * 4))

    return {
        "_id": f"seed-log-{patient_id}-{index+1}",
        "seed_sample": True,
        "patientId": patient_id,
        "patientName": patient_name,
        "nurseName": nurse_name,
        "createdAt": iso(created),
        "updatedAt": iso(created + timedelta(minutes=25)),
        "status": "critical" if (oxygen < 93 or temp >= 101.3 or hr > 118) else "stable",
        "vitals": {
            "heartRate": hr,
            "bloodPressureSystolic": bp_sys,
            "bloodPressureDiastolic": bp_dia,
            "temperature": temp,
            "sugarLevel": sugar,
            "oxygen": oxygen,
        },
        "doctor": {
            "name": doctor_name,
            "designation": doctor_title,
        },
        "doctorNotes": "Patient evaluated during ICU round. Continue close monitoring and reassess in 2 hours.",
        "medicines": [
            {
                "id": f"med-{patient_id}-{index+1}",
                "name": "Paracetamol" if index % 2 == 0 else "Cetirizine",
                "dose": "500 mg" if index % 2 == 0 else "10 mg",
                "route": "tablet",
                "administeredAt": iso(created + timedelta(minutes=10)),
            },
            {
                "id": f"inj-{patient_id}-{index+1}",
                "name": "Insulin",
                "dose": "6 units",
                "route": "injected",
                "administeredAt": iso(created + timedelta(minutes=45)),
            },
        ],
        "careSteps": [
            {
                "id": f"step-a-{patient_id}-{index+1}",
                "description": "Glucose support adjusted based on latest sugar trend.",
                "recordedAt": iso(created + timedelta(minutes=20)),
            },
            {
                "id": f"step-b-{patient_id}-{index+1}",
                "description": "Medication administered and response observed.",
                "recordedAt": iso(created + timedelta(minutes=55)),
            },
        ],
        "reports": [
            {
                "id": f"rep-{patient_id}-{index+1}",
                "title": "ICU Shift Summary",
                "summary": "Clinical response documented; continue current protocol and vitals charting.",
                "fileName": f"icu_shift_summary_{index+1}.pdf",
                "createdAt": iso(created + timedelta(minutes=70)),
            }
        ],
    }


async def seed() -> None:
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client.get_database()

    patients = await db.patients.find({"is_active": True}).sort("bed_number", 1).to_list(length=1000)
    if not patients:
        print("No active patients found. Seed patients first.")
        client.close()
        return

    now = datetime.now(UTC)

    patient_updates = 0
    logs_upserted = 0

    for idx, patient in enumerate(patients):
        patient_id = str(patient["_id"])
        patient_name = patient.get("full_name", f"Patient-{idx+1}")

        doctor_reports = [
            {
                "time": iso(now - timedelta(hours=18)),
                "doctor": "Dr. Arjun Sen",
                "title": "Doctor Notes Timeline - Morning",
                "summary": "Patient reviewed. Vitals acceptable with ongoing observation.",
                "createdAt": iso(now - timedelta(hours=18)),
                "fileName": "doctor_note_morning.pdf",
            },
            {
                "time": iso(now - timedelta(hours=8)),
                "doctor": "Dr. Priyanka Rao",
                "title": "Doctor Notes Timeline - Midday",
                "summary": "Medication response satisfactory. Continue monitoring sugar and BP.",
                "createdAt": iso(now - timedelta(hours=8)),
                "fileName": "doctor_note_midday.pdf",
            },
            {
                "time": iso(now - timedelta(hours=1)),
                "doctor": "Dr. Neha Iqbal",
                "title": "Reports Timeline - Evening Review",
                "summary": "No acute decline. Maintain ICU protocol and communicate updates to family.",
                "createdAt": iso(now - timedelta(hours=1)),
                "fileName": "doctor_note_evening.pdf",
            },
        ]

        care_timeline = [
            {
                "time": iso(now - timedelta(hours=10)),
                "title": "Patient Vitals + Clinical Inputs",
                "detail": "Heart rate, BP, temperature, sugar, oxygen entered and validated.",
                "by": "Nurse Priya",
            },
            {
                "time": iso(now - timedelta(hours=6)),
                "title": "Medicines, Steps, Reports",
                "detail": "Paracetamol and Cetirizine administered; insulin injected as advised.",
                "by": "Nurse Kavya",
            },
            {
                "time": iso(now - timedelta(hours=3)),
                "title": "Nursing observation",
                "detail": "Glucose dosage adjusted with continuous response tracking.",
                "by": "Nurse Rahul",
            },
            {
                "time": iso(now - timedelta(hours=1)),
                "title": "Family update",
                "detail": "Latest doctor and nurse logs synchronized to family portal.",
                "by": "Nurse Sahana",
            },
        ]

        await db.patients.update_one(
            {"_id": patient["_id"]},
            {
                "$set": {
                    "primary_unit": "Critical Care",
                    "latest_report": doctor_reports[-1]["summary"],
                    "nurse_note": "Vitals and medicines updated in scheduled intervals.",
                    "nurse_notes": "All bedside steps and interventions recorded with date and time.",
                    "doctor_reports": doctor_reports,
                    "care_timeline": care_timeline,
                    "sample_records_seeded": True,
                    "status_updated_at": now,
                }
            },
        )
        patient_updates += 1

        for log_index in range(4):
            log_doc = make_monitoring_log(patient_id, patient_name, log_index, now - timedelta(days=(idx % 3)))
            await db.monitoring_logs.replace_one({"_id": log_doc["_id"]}, log_doc, upsert=True)
            logs_upserted += 1

    client.close()
    print(f"Sample record seed complete: patients_updated={patient_updates}, monitoring_logs_upserted={logs_upserted}")


if __name__ == "__main__":
    import asyncio

    asyncio.run(seed())
