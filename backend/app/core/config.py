from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    app_name: str = "need-for-wheels-backend"
    env: str = os.getenv("ENV", "development")
    db_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://nfw_user:nfw_pass@db:5432/nfw_db",
    )
    google_api_key: str = os.getenv("api_key", "")


settings = Settings()
