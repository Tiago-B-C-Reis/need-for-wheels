from __future__ import annotations

from datetime import datetime

from ..exceptions import VerificationTokenError
from ...domain.repositories.user_repository import UserRepository


class VerifyEmail:
    def __init__(self, repo: UserRepository) -> None:
        self.repo = repo

    async def execute(self, *, token: str):
        token_record = await self.repo.get_verification_token(token)
        if token_record is None:
            raise VerificationTokenError("Invalid token")
        if token_record.consumed_at is not None:
            raise VerificationTokenError("Token already used")
        if token_record.expires_at <= datetime.utcnow():
            raise VerificationTokenError("Token expired")

        user = await self.repo.get_by_id(token_record.user_id)
        if user is None:
            raise VerificationTokenError("User not found")

        now = datetime.utcnow()
        user.is_active = True
        user.email_verified_at = now
        user.updated_at = now

        await self.repo.update(user)
        await self.repo.mark_token_consumed(token)
        return user
