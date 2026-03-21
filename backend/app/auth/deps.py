from fastapi import Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import User

async def get_current_user(
    x_user_id: str = Header(None, alias="X-User-ID"),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not x_user_id:
        # For simplicity, if no ID, we return a mock admin/nurse or return 401
        # In a real simple app, we might just use a hardcoded dev user
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        if not user:
             # Create a default admin/nurse if none exists
             user = User(id="dev-nurse", full_name="Nurse Priya", role="nurse", email="priya@visicare.health")
             db.add(user)
             await db.commit()
             await db.refresh(user)
        return user

    result = await db.execute(select(User).where(User.id == x_user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def require_role(*roles):
    async def role_checker(user: User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker


def require_role(*roles):
    async def role_checker(user: User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker
