from datetime import datetime
from ...domain.entities.experiment import Experiment
from ...domain.repositories.experiment_repository import ExperimentRepository


class CreateExperiment:
    def __init__(self, repo: ExperimentRepository):
        self.repo = repo

    async def execute(self, *, id: str, brand: str | None, model: str | None, year: str | None, created_at: datetime | None = None) -> Experiment:
        exp = Experiment(
            id=id,
            brand=brand,
            model=model,
            year=year,
            created_at=created_at or datetime.utcnow(),
        )
        await self.repo.create(exp)
        return exp

