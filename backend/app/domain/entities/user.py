from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass(slots=True)
class User:
    id: str
    email: str
    display_name: Optional[str]
    provider: str
    provider_user_id: Optional[str]
    password_hash: Optional[str]
    is_active: bool
    email_verified_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


@dataclass(slots=True)
class EmailVerificationToken:
    token: str
    user_id: str
    expires_at: datetime
    consumed_at: Optional[datetime]
    created_at: datetime
