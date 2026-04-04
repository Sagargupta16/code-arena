from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.db import get_db
from app.services.auth import (
    create_access_token,
    exchange_github_code,
    get_github_login_url,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class GitHubCallbackBody(BaseModel):
    code: str


@router.get("/github/login")
async def github_login():
    return {"url": get_github_login_url()}


@router.post("/github/callback")
async def github_callback(body: GitHubCallbackBody):
    try:
        gh_user = await exchange_github_code(body.code)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

    github_id = gh_user["id"]
    username = gh_user.get("login", "")
    email = gh_user.get("email") or ""
    avatar = gh_user.get("avatar_url") or ""

    db = get_db()
    user = await db.users.find_one({"github_id": github_id})

    if user:
        await db.users.update_one(
            {"github_id": github_id},
            {"$set": {"username": username, "email": email, "avatar": avatar}},
        )
        user_id = user["_id"]
    else:
        user_id = str(github_id)
        user_doc = {
            "_id": user_id,
            "github_id": github_id,
            "username": username,
            "email": email,
            "avatar": avatar,
            "stats": {"matches_played": 0, "wins": 0, "total_score": 0.0, "problems_solved": 0},
        }
        await db.users.insert_one(user_doc)

    token = create_access_token(user_id)
    return {"token": token, "user_id": user_id, "username": username}
