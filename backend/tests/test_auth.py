from __future__ import annotations

from app.services.auth import (
    create_access_token,
    decode_access_token,
    get_github_login_url,
)


def test_create_and_decode_token():
    token = create_access_token("user-abc")
    user_id = decode_access_token(token)
    assert user_id == "user-abc"


def test_decode_invalid_token():
    result = decode_access_token("not.a.valid.token")
    assert result is None


def test_github_login_url_contains_client_id():
    url = get_github_login_url()
    assert "github.com/login/oauth/authorize" in url
    assert "client_id=" in url
    assert "scope=" in url
