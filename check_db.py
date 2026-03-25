import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
async def main():
    db = AsyncIOMotorClient("mongodb://localhost:27017").visicare_db
    p = await db.patients.find_one()
    print("Patient keys:", p.keys())
    print("doctor_reports:", p.get("doctor_reports", "MISSING!"))
    logs = await db.monitoring_logs.find_one({"patientId": p["_id"]})
    print("Log keys:", logs.keys() if logs else "No logs")
    print("Log reports:", logs.get("reports", "MISSING!") if logs else "No logs")
    chunks = await db.patient_document_chunks.count_documents({})
    print("Chunks count:", chunks)
asyncio.run(main())