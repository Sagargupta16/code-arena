from __future__ import annotations

from app.ws.manager import ConnectionManager


def test_manager_init():
    mgr = ConnectionManager()
    assert mgr.rooms == {}
    assert mgr.get_player_count("ROOM01") == 0


def test_disconnect_nonexistent_room():
    mgr = ConnectionManager()
    mgr.disconnect("NOROOM", "user1")
    assert mgr.rooms == {}


def test_get_player_count_empty():
    mgr = ConnectionManager()
    assert mgr.get_player_count("XYZ") == 0
