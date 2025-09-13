from pydantic import BaseModel, Field
from datetime import datetime


class ExperimentIn(BaseModel):
    id: str = Field(..., description="UUID for the experiment")
    brand: str | None = None
    model: str | None = None
    year: str | None = None
    created_at: datetime | None = None


class ExperimentOut(BaseModel):
    id: str
    brand: str | None
    model: str | None
    year: str | None
    created_at: datetime

