from typing import Sequence
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from ...domain.entities.experiment import Experiment
from ...domain.repositories.experiment_repository import ExperimentRepository


class SqlExperimentRepository(ExperimentRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, exp: Experiment) -> None:
        await self.session.execute(
            text(
                """
                INSERT INTO experiments (id, brand, model, year, created_at)
                VALUES (:id, :brand, :model, :year, :created_at)
                """
            ),
            {
                "id": exp.id,
                "brand": exp.brand,
                "model": exp.model,
                "year": exp.year,
                "created_at": exp.created_at,
            },
        )
        await self.session.commit()

    async def list(self, limit: int = 50, offset: int = 0) -> Sequence[Experiment]:
        rows = (
            await self.session.execute(
                text(
                    "SELECT id, brand, model, year, created_at FROM experiments ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
                ),
                {"limit": limit, "offset": offset},
            )
        ).all()
        return [
            Experiment(
                id=r[0], brand=r[1], model=r[2], year=r[3], created_at=r[4]
            )
            for r in rows
        ]

    async def delete(self, exp_id: str) -> None:
        await self.session.execute(
            text("DELETE FROM experiments WHERE id = :id"), {"id": exp_id}
        )
        await self.session.commit()

