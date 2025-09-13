from ...domain.repositories.experiment_repository import ExperimentRepository
from ...domain.entities.experiment import Experiment
from typing import Sequence


class ListExperiments:
    def __init__(self, repo: ExperimentRepository):
        self.repo = repo

    async def execute(self, *, limit: int = 50, offset: int = 0) -> Sequence[Experiment]:
        return await self.repo.list(limit=limit, offset=offset)

