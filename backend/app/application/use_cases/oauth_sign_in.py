from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import uuid4

from ..services.security import TokenService
from ...domain.entities.user import User
from ...domain.repositories.user_repository import UserRepository


class OAuthSignIn:
    def __init__(self, repo: UserRepository, token_service: TokenService) -> None:
        self.repo = repo
        self.token_service = token_service

    async def execute(
        self,
        *,
        provider: str,
        provider_user_id: str,
        email: str,
        display_name: Optional[str],
    ) -> tuple[User, dict[str, str]]:
        provider = provider.lower()
        now = datetime.utcnow()

        user = await self.repo.get_by_provider(provider=provider, provider_user_id=provider_user_id)
        if user is None:
            normalized_email = email.strip().lower()
            user = await self.repo.get_by_email(normalized_email)
            if user is None:
                # brand new user
                user = User(
                    id=str(uuid4()),
                    email=normalized_email,
                    display_name=display_name,
                    provider=provider,
                    provider_user_id=provider_user_id,
                    password_hash=None,
                    is_active=True,
                    email_verified_at=now,
                    created_at=now,
                    updated_at=now,
                )
                await self.repo.create(user)
            else:
                # Link existing email-based account
                user.provider = provider
                user.provider_user_id = provider_user_id
                user.display_name = display_name or user.display_name
                user.is_active = True
                if user.email_verified_at is None:
                    user.email_verified_at = now
                user.updated_at = now
                await self.repo.update(user)
        else:
            # Update profile info to latest
            user.display_name = display_name or user.display_name
            if email:
                user.email = email.strip().lower()
            user.is_active = True
            if user.email_verified_at is None:
                user.email_verified_at = now
            user.updated_at = now
            await self.repo.update(user)

        access_token = self.token_service.create_access_token(
            subject=user.id,
            extra={"email": user.email, "provider": user.provider},
        )
        return user, {"access_token": access_token, "token_type": "bearer"}
