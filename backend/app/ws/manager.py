from __future__ import annotations

import json
import logging
from dataclasses import dataclass

from fastapi import WebSocket

logger = logging.getLogger("code_arena.ws")


@dataclass
class RoomConnection:
    user_id: str
    username: str
    websocket: WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.rooms: dict[str, list[RoomConnection]] = {}

    async def connect(self, room_code: str, user_id: str, username: str, ws: WebSocket) -> None:
        await ws.accept()
        conn = RoomConnection(user_id=user_id, username=username, websocket=ws)
        if room_code not in self.rooms:
            self.rooms[room_code] = []
        self.rooms[room_code] = [c for c in self.rooms[room_code] if c.user_id != user_id]
        self.rooms[room_code].append(conn)
        logger.info("connect room=%s user=%s (%s) players=%d", room_code, user_id, username, len(self.rooms[room_code]))

    def disconnect(self, room_code: str, user_id: str) -> None:
        if room_code in self.rooms:
            self.rooms[room_code] = [c for c in self.rooms[room_code] if c.user_id != user_id]
            remaining = len(self.rooms[room_code])
            if not self.rooms[room_code]:
                del self.rooms[room_code]
            logger.info("disconnect room=%s user=%s remaining=%d", room_code, user_id, remaining)

    async def send_to_user(self, room_code: str, user_id: str, event: str, data: dict) -> None:
        if room_code not in self.rooms:
            logger.warning("send_to_user room=%s not found", room_code)
            return
        for conn in self.rooms[room_code]:
            if conn.user_id == user_id:
                await conn.websocket.send_text(json.dumps({"event": event, **data}))
                logger.debug("send_to_user room=%s user=%s event=%s", room_code, user_id, event)
                break

    async def broadcast(self, room_code: str, event: str, data: dict) -> None:
        if room_code not in self.rooms:
            logger.warning("broadcast room=%s not found", room_code)
            return
        message = json.dumps({"event": event, **data})
        count = 0
        for conn in self.rooms[room_code]:
            try:
                await conn.websocket.send_text(message)
                count += 1
            except Exception as e:
                logger.error("broadcast send failed room=%s user=%s: %s", room_code, conn.user_id, e)
        logger.info("broadcast room=%s event=%s sent_to=%d", room_code, event, count)

    async def broadcast_except(self, room_code: str, exclude_user: str, event: str, data: dict) -> None:
        if room_code not in self.rooms:
            return
        message = json.dumps({"event": event, **data})
        for conn in self.rooms[room_code]:
            if conn.user_id != exclude_user:
                try:
                    await conn.websocket.send_text(message)
                except Exception as e:
                    logger.error("broadcast_except send failed room=%s user=%s: %s", room_code, conn.user_id, e)

    def get_player_count(self, room_code: str) -> int:
        return len(self.rooms.get(room_code, []))


manager = ConnectionManager()
