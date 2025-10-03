from __future__ import annotations

from datetime import datetime

from ..exceptions import InvalidCredentialsError, EmailNotVerifiedError
from ..services.security import PasswordHasher, TokenService
from ...domain.repositories.user_repository import UserRepository


class LoginUser:
    def __init__(self, repo: UserRepository, hasher: PasswordHasher, token_service: TokenService) -> None:
        self.repo = repo
        self.hasher = hasher
        self.token_service = token_service

    async def execute(self, *, email: str, password: str) -> dict[str, str]:
        normalized_email = email.strip().lower()
        user = await self.repo.get_by_email(normalized_email)
        if user is None or user.provider != "local" or not user.password_hash:
            raise InvalidCredentialsError("Invalid credentials")
        if not self.hasher.verify(password, user.password_hash):
            raise InvalidCredentialsError("Invalid credentials")
        if not user.is_active:
            raise EmailNotVerifiedError("Email not verified")

        user.updated_at = datetime.utcnow()
        await self.repo.update(user)

        access_token = self.token_service.create_access_token(
            subject=user.id,
            extra={"email": user.email, "provider": user.provider},
        )
        return {"access_token": access_token, "token_type": "bearer"}
