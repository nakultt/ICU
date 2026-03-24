from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt

from ..database import get_db
from ..models import User, generate_uuid
from ..config import settings
from ..auth.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "family"

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

@router.post("/register", response_model=UserResponse)
async def register(req: UserRegister, db: AsyncIOMotorDatabase = Depends(get_db)):
    existing = await db.users.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = pwd_context.hash(req.password)
    user_data = {
        "_id": generate_uuid(),
        "email": req.email,
        "hashed_password": hashed_password,
        "full_name": req.full_name,
        "role": req.role,
        "phone": "",
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    await db.users.insert_one(user_data)
    return UserResponse(id=user_data["_id"], email=user_data["email"], full_name=user_data["full_name"], role=user_data["role"])

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncIOMotorDatabase = Depends(get_db)):
    user_dict = await db.users.find_one({"email": form_data.username})
    if not user_dict or not pwd_context.verify(form_data.password, user_dict["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_dict["_id"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user_dict["role"]}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return UserResponse(id=current_user.id, email=current_user.email, full_name=current_user.full_name, role=current_user.role)
