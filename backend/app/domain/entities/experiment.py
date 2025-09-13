from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Experiment:
    id: str
    brand: Optional[str]
    model: Optional[str]
    year: Optional[str]
    created_at: datetime

