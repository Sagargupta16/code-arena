from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongo_uri: str = "mongodb://localhost:27017/code_arena"
    mongo_db: str = "code_arena"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiry_minutes: int = 1440
    piston_url: str = "http://localhost:2000"
    leetcode_api_url: str = "http://localhost:3000"
    github_client_id: str = ""
    github_client_secret: str = ""
    github_redirect_uri: str = "http://localhost:5173/auth/callback"
    cors_origins: str = "http://localhost:5173"

    model_config = {"env_file": "../.env", "extra": "ignore"}


settings = Settings()
