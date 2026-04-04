from __future__ import annotations

from app.services.room import generate_room_code


def test_room_code_format():
    code = generate_room_code()
    assert len(code) == 6
    assert code.isalnum()
    assert code.isupper() or any(c.isdigit() for c in code)


def test_room_code_uniqueness():
    codes = {generate_room_code() for _ in range(100)}
    assert len(codes) > 90
