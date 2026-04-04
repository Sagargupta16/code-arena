from __future__ import annotations

import random
import string

from app.db import get_db


def generate_room_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


async def create_room(host_id: str, settings: dict) -> dict:
    db = get_db()
    code = generate_room_code()
    while await db.rooms.find_one({"code": code}):
        code = generate_room_code()

    room_doc = {
        "_id": code,
        "code": code,
        "host_id": host_id,
        "players": [host_id],
        "status": "waiting",
        "settings": settings,
        "problem_id": None,
    }
    await db.rooms.insert_one(room_doc)
    return room_doc


async def join_room(code: str, user_id: str) -> dict:
    db = get_db()
    room = await db.rooms.find_one({"code": code})
    if not room:
        raise ValueError("Room not found")
    if room["status"] != "waiting":
        raise ValueError("Match already in progress")
    if user_id in room["players"]:
        return room
    if len(room["players"]) >= 5:
        raise ValueError("Room is full")

    await db.rooms.update_one({"code": code}, {"$push": {"players": user_id}})
    return await db.rooms.find_one({"code": code})


async def leave_room(code: str, user_id: str) -> dict | None:
    db = get_db()
    await db.rooms.update_one({"code": code}, {"$pull": {"players": user_id}})
    room = await db.rooms.find_one({"code": code})
    if room and len(room["players"]) == 0:
        await db.rooms.delete_one({"code": code})
        return None
    return room


async def get_room(code: str) -> dict | None:
    db = get_db()
    return await db.rooms.find_one({"code": code})
