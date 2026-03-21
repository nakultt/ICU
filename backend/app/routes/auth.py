from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from ..database import get_db
from ..models import User
from ..auth.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

class UserRequest(BaseModel):
    email: str
    full_name: str
    role: str = "family"

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str

@router.post("/identify", response_model=UserResponse)
async def identify(req: UserRequest, db: AsyncSession = Depends(get_db)):
    # Simple "Identify": find user or create
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    
    if not user:
        user = User(
            email=req.email,
            full_name=req.full_name,
            role=req.role
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    return user

@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return user
