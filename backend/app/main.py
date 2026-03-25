from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .routes import auth, patients, visits, signaling, ai

app = FastAPI(title="VisiCare API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",           # Local Vite dev server
        "https://icu-snowy.vercel.app",    # Vercel Production
        # To allow Vercel preview domains broadly, we can also use allow_origin_regex
        # But for now, we just list your main domains
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db()

@app.get("/api/health")
async def health():
    return {"status": "ok"}

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(visits.router)
app.include_router(signaling.router)
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
