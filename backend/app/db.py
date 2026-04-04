from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import settings

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    global client, db
    client = AsyncIOMotorClient(settings.mongo_uri)
    db = client[settings.mongo_db]
    await db.users.create_index("github_id", unique=True)
    await db.users.create_index("username", unique=True)
    await db.rooms.create_index("code", unique=True)
    await db.problems.create_index("leetcode_id")


async def close_db() -> None:
    global client
    if client:
        client.close()


def get_db() -> AsyncIOMotorDatabase:
    assert db is not None, "Database not connected"
    return db
