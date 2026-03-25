from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from app.ai_service import (
    generate_patient_summary,
    chat_with_patient_context,
    embed_patient_data
)

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, Any]] = []

@router.get("/summary/{patient_id}")
async def get_patient_summary(patient_id: str):
    try:
        summary = await generate_patient_summary(patient_id)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/{patient_id}")
async def chat_with_ai(patient_id: str, request: ChatRequest):
    try:
        response_text = await chat_with_patient_context(
            patient_id, 
            request.message, 
            request.history
        )
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/index/{patient_id}")
async def index_patient_data(patient_id: str):
    """Admin/Internal endpoint to manually trigger embedding of a patient's data."""
    try:
        await embed_patient_data(patient_id)
        return {"status": "success", "message": f"Successfully indexed data for patient {patient_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
