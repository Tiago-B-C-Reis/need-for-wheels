import os
from pathlib import Path

from pydantic import BaseModel, field_validator
from dotenv import load_dotenv

env_path = next((parent / ".env" for parent in Path(__file__).resolve().parents if (parent / ".env").exists()), None)

if env_path:
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()


def _bool_from_env(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class Settings(BaseModel):
    app_name: str = "need-for-wheels-backend"
    env: str = os.getenv("ENV", "development")
    db_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://nfw_user:nfw_pass@db:5432/nfw_db",
    )
    google_api_key: str = os.getenv("api_key", "")
    jwt_secret: str = os.getenv("JWT_SECRET", "change-me")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_access_token_exp_minutes: int = int(os.getenv("JWT_ACCESS_TOKEN_EXP_MINUTES", "60"))
    google_client_id: str | None = os.getenv("GOOGLE_CLIENT_ID")
    apple_client_id: str | None = os.getenv("APPLE_CLIENT_ID")
    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:3000").split(",")
        if origin.strip()
    ]
    smtp_host: str | None = os.getenv("SMTP_HOST")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_username: str | None = os.getenv("SMTP_USERNAME")
    smtp_password: str | None = os.getenv("SMTP_PASSWORD")
    smtp_use_tls: bool = _bool_from_env("SMTP_USE_TLS", True)
    smtp_use_ssl: bool = _bool_from_env("SMTP_USE_SSL", False)
    smtp_from_email: str | None = os.getenv("SMTP_FROM_EMAIL")
    smtp_reply_to: str | None = os.getenv("SMTP_REPLY_TO")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def ensure_list(cls, v):
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            return [item.strip() for item in v.split(",") if item.strip()]
        return ["http://localhost:3000"]


settings = Settings()
