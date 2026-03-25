import math
from typing import List, Dict, Any
from bson import ObjectId
from google import genai
from app.config import settings
from app.database import get_db

async def get_database():
    async for db in get_db():
        return db
from app.models import PatientDocumentChunk

# Initialize Gemini Client
# The client automatically picks up GEMINI_API_KEY from the environment if present,
# but passing it explicitly since we have it in settings.
client = genai.Client(api_key=settings.GEMINI_API_KEY)

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    dot_product = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot_product / (norm_a * norm_b)

def chunk_text(text: str, chunk_size: int = 500) -> List[str]:
    # Simple chunking by paragraph or fixed characters if no paragraphs
    chunks = []
    paragraphs = text.split('\n\n')
    current_chunk = ""
    for p in paragraphs:
        if len(current_chunk) + len(p) > chunk_size and current_chunk:
            chunks.append(current_chunk.strip())
            current_chunk = p
        else:
            current_chunk += "\n\n" + p if current_chunk else p
    if current_chunk:
        chunks.append(current_chunk.strip())
    return [c for c in chunks if c]

async def embed_patient_data(patient_id: str) -> None:
    """Fetches patient data, chunks it, embeds it, and saves to MongoDB."""
    db = await get_database()
    patient = await db.patients.find_one({"_id": patient_id})
    if not patient:
        raise ValueError("Patient not found")

    # Clear old chunks for this patient to re-index fresh
    await db.patient_document_chunks.delete_many({"patient_id": patient_id})

    # Prepare texts to embed
    texts_to_embed = []
    
    # Add diagnosis and basic info
    texts_to_embed.append(f"Patient Name: {patient.get('full_name')} (Age: {patient.get('age')}, Gender: {patient.get('gender')})\nDiagnosis: {patient.get('diagnosis')}\nWard: {patient.get('ward')}, Bed: {patient.get('bed_number')}\nCurrent Status: {patient.get('current_status')} - {patient.get('status_note')}")

    if "nurse_note" in patient:
        texts_to_embed.append(f"Nurse Note: {patient['nurse_note']}")
    if "nurse_notes" in patient:
        texts_to_embed.append(f"Additional Nurse Notes: {patient['nurse_notes']}")

    if "doctor_reports" in patient and isinstance(patient["doctor_reports"], list):
        for rep in patient["doctor_reports"]:
            texts_to_embed.append(f"Doctor Report ({rep.get('time', '')}) by {rep.get('doctor', '')}:\nTitle: {rep.get('title', '')}\nSummary: {rep.get('summary', '')}")

    if "care_timeline" in patient and isinstance(patient["care_timeline"], list):
        for ct in patient["care_timeline"]:
            texts_to_embed.append(f"Care Timeline ({ct.get('time', '')}) by {ct.get('by', '')}: {ct.get('title', '')} - {ct.get('detail', '')}")

    # Fetch monitoring logs
    logs_cursor = db.monitoring_logs.find({"patientId": patient_id})
    logs = await logs_cursor.to_list(length=100)
    for log in logs:
        log_text = f"Monitoring Log recorded at {log.get('createdAt')}:\n"
        if "vitals" in log:
            log_text += f"Vitals: {log['vitals']}\n"
        if log.get("doctorNotes"):
            log_text += f"Doctor Note: {log['doctorNotes']}\n"
        if "medicines" in log:
            for med in log["medicines"]:
                log_text += f"Medicine Administered: {med.get('name')} {med.get('dose')} via {med.get('route')} at {med.get('administeredAt')}\n"
        if "careSteps" in log:
            for step in log["careSteps"]:
                log_text += f"Care Step: {step.get('description')} at {step.get('recordedAt')}\n"
        texts_to_embed.append(log_text)

    # Chunk the compiled texts
    final_chunks = []
    for text in texts_to_embed:
        final_chunks.extend(chunk_text(text))

    if not final_chunks:
        return

    # Create embeddings
    chunks_to_insert = []
    for chunk in final_chunks:
        try:
            response = client.models.embed_content(
                model='gemini-embedding-001',
                contents=chunk
            )
            embedding = response.embeddings[0].values
            
            doc = PatientDocumentChunk(
                patient_id=patient_id,
                chunk_text=chunk,
                embedding=embedding,
                metadata={"source": "Patient Records"}
            )
            chunks_to_insert.append(doc.dict(by_alias=True))
        except Exception as e:
            print(f"Failed to embed chunk: {e}")

    if chunks_to_insert:
        await db.patient_document_chunks.insert_many(chunks_to_insert)

async def retrieve_relevant_context(patient_id: str, query: str, top_k: int = 3) -> str:
    """Embeds the query and retrieves the most relevant chunks using cosine similarity."""
    db = await get_database()
    
    try:
        response = client.models.embed_content(
            model='gemini-embedding-001',
            contents=query
        )
        query_embedding = response.embeddings[0].values
    except Exception as e:
        print(f"Failed to embed query: {e}")
        return ""

    chunks_cursor = db.patient_document_chunks.find({"patient_id": patient_id})
    chunks = await chunks_cursor.to_list(length=1000)

    if not chunks:
        return ""

    # Score and sort chunks
    scored_chunks = []
    for c in chunks:
        score = cosine_similarity(query_embedding, c["embedding"])
        scored_chunks.append({"score": score, "text": c["chunk_text"]})
    
    scored_chunks.sort(key=lambda x: x["score"], reverse=True)
    top_chunks = scored_chunks[:top_k]

    context_str = "\n\n---\n\n".join([f"RELEVANT CONTEXT (Score: {c['score']:.2f}):\n{c['text']}" for c in top_chunks])
    return context_str

async def generate_patient_summary(patient_id: str) -> str:
    """Generates a comprehensive summary using all patient data directly."""
    db = await get_database()
    patient = await db.patients.find_one({"_id": patient_id})
    if not patient:
        raise ValueError("Patient not found")
        
    logs_cursor = db.monitoring_logs.find({"patientId": patient_id}).sort("createdAt", -1).limit(50)
    logs = await logs_cursor.to_list(length=50)

    # Sanitize slightly to avoid ObjectId issues with JSON serialization
    patient_copy = {k: str(v) if isinstance(v, ObjectId) else v for k, v in patient.items()}
    logs_copy = [{k: str(v) if isinstance(v, ObjectId) else v for k, v in log.items()} for log in logs]

    prompt = f"""
    You are an expert medical AI assistant for VisiCare. 
    Review the following patient data and monitoring logs and write a compassionate, easy-to-understand comprehensive summary for the family.
    Highlight the diagnosis, current status, recent doctor reports, and any nursing notes.
    Format with markdown headers, bullet points, and use a reassuring but factual tone.

    Patient Main Profile:
    {patient_copy}
    
    Recent Monitoring Logs and Reports:
    {logs_copy}
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        return response.text
    except Exception as e:
        return f"Error generating summary: {str(e)}"

async def chat_with_patient_context(patient_id: str, user_message: str, history: List[Dict[str, str]]) -> str:
    """Chat matching user message against direct patient data context for highest accuracy."""
    db = await get_database()
    
    # Try fetching patient and logs for exact, real-term factual context without just relying on chunks
    patient = await db.patients.find_one({"_id": patient_id})
    if patient:
        patient_copy = {k: str(v) if isinstance(v, ObjectId) else v for k, v in patient.items()}
    else:
        patient_copy = {"error": "Patient not found"}
        
    logs_cursor = db.monitoring_logs.find({"patientId": patient_id}).sort("createdAt", -1).limit(50)
    logs = await logs_cursor.to_list(length=50)
    logs_copy = [{k: str(v) if isinstance(v, ObjectId) else v for k, v in log.items()} for log in logs]

    # Also grab RAG context if it exists, to capture any chunked historic documents
    context = await retrieve_relevant_context(patient_id, user_message, top_k=3)

    sys_instruction = f"""
    You are the VisiCare AI Assistant responding to a family member's questions about a patient in the ICU.
    Use ONLY the factual context provided below to answer their questions accurately. Focus heavily on both `Doctor Reports` and `Monitoring Logs`.
    If the context doesn't contain the answer, politely say you don't have that specific information.
    Be compassionate, supportive, and clear. Avoid overly dense medical jargon without explanation.
    
    --- REAL-TIME PATIENT DATA ---
    Profile: {patient_copy}
    Recent Logs/Reports/Vitals: {logs_copy}
    
    --- EMBEDDED HISTORIC DATA (RAG) ---
    {context}
    """

    # Format history for Gemini structured messages
    contents = [{"role": "user", "parts": [{"text": sys_instruction}]}]
    
    # Adding history
    for msg in history:
        # Map frontend roles to gemini roles (user -> user, ai -> model)
        role = "model" if msg.get("role") in ["ai", "assistant", "model"] else "user"
        text = msg.get("parts", [{}])[0].get("text", msg.get("text", "")) or msg.get("content", "")
        if text:
            contents.append({"role": role, "parts": [{"text": text}]})

    # Add the current message
    contents.append({"role": "user", "parts": [{"text": user_message}]})

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents
        )
        return response.text
    except Exception as e:
        return f"I apologize, but I encountered an error while processing your request: {str(e)}"
