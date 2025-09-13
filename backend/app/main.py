from fastapi import FastAPI
from .core.config import settings
from .infrastructure.db.database import healthcheck
from .presentation.api.v1.routers import router as experiments_router


app = FastAPI(title=settings.app_name)


@app.get("/health")
async def health():
    await healthcheck()
    return {"ok": True}


app.include_router(experiments_router, prefix="/api/v1")

