from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text
from ...core.config import settings


engine = create_async_engine(settings.db_url, echo=False, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def healthcheck() -> bool:
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    return True

