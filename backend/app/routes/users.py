from __future__ import annotations

from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.models.user import UserPublic, UserStats

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserPublic)
async def get_me(user: dict = Depends(get_current_user)):
    return UserPublic(
        id=user["_id"],
        username=user["username"],
        avatar=user.get("avatar", ""),
        stats=UserStats(**user.get("stats", {})),
    )
