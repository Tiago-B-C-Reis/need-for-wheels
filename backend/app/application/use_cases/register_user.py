from __future__ import annotations

from datetime import datetime, timedelta
from uuid import uuid4

from ..exceptions import DuplicateEmailError
from ..services.security import PasswordHasher
from ...domain.entities.user import User, EmailVerificationToken
from ...domain.repositories.user_repository import UserRepository


class RegisterUser:
    def __init__(self, repo: UserRepository, hasher: PasswordHasher, *, verification_ttl_hours: int = 24) -> None:
        self.repo = repo
        self.hasher = hasher
        self.verification_ttl = timedelta(hours=verification_ttl_hours)

    async def execute(self, *, email: str, password: str, display_name: str | None) -> tuple[User, EmailVerificationToken]:
        normalized_email = email.strip().lower()
        existing = await self.repo.get_by_email(normalized_email)
        if existing is not None:
            raise DuplicateEmailError("Email already registered")

        now = datetime.utcnow()
        user = User(
            id=str(uuid4()),
            email=normalized_email,
            display_name=display_name,
            provider="local",
            provider_user_id=None,
            password_hash=self.hasher.hash(password),
            is_active=False,
            email_verified_at=None,
            created_at=now,
            updated_at=now,
        )
        token = EmailVerificationToken(
            token=str(uuid4()),
            user_id=user.id,
            expires_at=now + self.verification_ttl,
            consumed_at=None,
            created_at=now,
        )

        await self.repo.create(user)
        await self.repo.create_verification_token(token)
        return user, token
