from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import get_current_user
from app.models.room import RoomCreate, RoomPublic
from app.services.room import create_room, get_room, join_room

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create(body: RoomCreate, user: dict = Depends(get_current_user)):
    room = await create_room(user["_id"], body.settings.model_dump())
    return {"code": room["code"]}


@router.get("/{code}", response_model=RoomPublic)
async def get(code: str, user: dict = Depends(get_current_user)):
    room = await get_room(code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return RoomPublic(
        code=room["code"],
        host_id=room["host_id"],
        players=room["players"],
        status=room["status"],
        settings=room["settings"],
        problem_id=room.get("problem_id"),
    )


@router.post("/{code}/join")
async def join(code: str, user: dict = Depends(get_current_user)):
    try:
        room = await join_room(code, user["_id"])
        return {"code": room["code"], "players": room["players"]}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
