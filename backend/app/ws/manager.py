from __future__ import annotations

import json
from dataclasses import dataclass, field

from fastapi import WebSocket


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

    def disconnect(self, room_code: str, user_id: str) -> None:
        if room_code in self.rooms:
            self.rooms[room_code] = [c for c in self.rooms[room_code] if c.user_id != user_id]
            if not self.rooms[room_code]:
                del self.rooms[room_code]

    async def send_to_user(self, room_code: str, user_id: str, event: str, data: dict) -> None:
        if room_code not in self.rooms:
            return
        for conn in self.rooms[room_code]:
            if conn.user_id == user_id:
                await conn.websocket.send_text(json.dumps({"event": event, **data}))
                break

    async def broadcast(self, room_code: str, event: str, data: dict) -> None:
        if room_code not in self.rooms:
            return
        message = json.dumps({"event": event, **data})
        for conn in self.rooms[room_code]:
            try:
                await conn.websocket.send_text(message)
            except Exception:
                pass

    async def broadcast_except(self, room_code: str, exclude_user: str, event: str, data: dict) -> None:
        if room_code not in self.rooms:
            return
        message = json.dumps({"event": event, **data})
        for conn in self.rooms[room_code]:
            if conn.user_id != exclude_user:
                try:
                    await conn.websocket.send_text(message)
                except Exception:
                    pass

    def get_player_count(self, room_code: str) -> int:
        return len(self.rooms.get(room_code, []))


manager = ConnectionManager()
