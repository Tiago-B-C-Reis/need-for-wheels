from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .infrastructure.db.database import healthcheck
from .presentation.api.v1.routers import router as experiments_router


app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    await healthcheck()
    return {"ok": True}


app.include_router(experiments_router, prefix="/api/v1")
