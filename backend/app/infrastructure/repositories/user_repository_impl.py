from __future__ import annotations

from typing import Optional
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from ...domain.entities.user import User, EmailVerificationToken
from ...domain.repositories.user_repository import UserRepository


class SqlUserRepository(UserRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, user: User) -> None:
        await self.session.execute(
            text(
                """
                INSERT INTO users (
                    id, email, display_name, provider, provider_user_id,
                    password_hash, is_active, email_verified_at, created_at, updated_at
                ) VALUES (
                    :id, :email, :display_name, :provider, :provider_user_id,
                    :password_hash, :is_active, :email_verified_at, :created_at, :updated_at
                )
                """
            ),
            {
                "id": user.id,
                "email": user.email,
                "display_name": user.display_name,
                "provider": user.provider,
                "provider_user_id": user.provider_user_id,
                "password_hash": user.password_hash,
                "is_active": user.is_active,
                "email_verified_at": user.email_verified_at,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
            },
        )
        await self.session.commit()

    async def update(self, user: User) -> None:
        await self.session.execute(
            text(
                """
                UPDATE users
                SET email = :email,
                    display_name = :display_name,
                    provider = :provider,
                    provider_user_id = :provider_user_id,
                    password_hash = :password_hash,
                    is_active = :is_active,
                    email_verified_at = :email_verified_at,
                    updated_at = :updated_at
                WHERE id = :id
                """
            ),
            {
                "id": user.id,
                "email": user.email,
                "display_name": user.display_name,
                "provider": user.provider,
                "provider_user_id": user.provider_user_id,
                "password_hash": user.password_hash,
                "is_active": user.is_active,
                "email_verified_at": user.email_verified_at,
                "updated_at": user.updated_at,
            },
        )
        await self.session.commit()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.session.execute(
            text(
                """
                SELECT id, email, display_name, provider, provider_user_id, password_hash,
                       is_active, email_verified_at, created_at, updated_at
                FROM users
                WHERE email = :email
                """
            ),
            {"email": email},
        )
        row = result.first()
        return self._row_to_user(row) if row else None

    async def get_by_id(self, user_id: str) -> Optional[User]:
        result = await self.session.execute(
            text(
                """
                SELECT id, email, display_name, provider, provider_user_id, password_hash,
                       is_active, email_verified_at, created_at, updated_at
                FROM users
                WHERE id = :user_id
                """
            ),
            {"user_id": user_id},
        )
        row = result.first()
        return self._row_to_user(row) if row else None

    async def get_by_provider(
        self, *, provider: str, provider_user_id: str
    ) -> Optional[User]:
        result = await self.session.execute(
            text(
                """
                SELECT id, email, display_name, provider, provider_user_id, password_hash,
                       is_active, email_verified_at, created_at, updated_at
                FROM users
                WHERE provider = :provider AND provider_user_id = :provider_user_id
                """
            ),
            {"provider": provider, "provider_user_id": provider_user_id},
        )
        row = result.first()
        return self._row_to_user(row) if row else None

    async def create_verification_token(
        self, token: EmailVerificationToken
    ) -> None:
        await self.session.execute(
            text(
                """
                INSERT INTO email_verification_tokens (
                    token, user_id, expires_at, consumed_at, created_at
                ) VALUES (
                    :token, :user_id, :expires_at, :consumed_at, :created_at
                )
                """
            ),
            {
                "token": token.token,
                "user_id": token.user_id,
                "expires_at": token.expires_at,
                "consumed_at": token.consumed_at,
                "created_at": token.created_at,
            },
        )
        await self.session.commit()

    async def get_verification_token(
        self, token: str
    ) -> Optional[EmailVerificationToken]:
        result = await self.session.execute(
            text(
                """
                SELECT token, user_id, expires_at, consumed_at, created_at
                FROM email_verification_tokens
                WHERE token = :token
                """
            ),
            {"token": token},
        )
        row = result.first()
        return self._row_to_token(row) if row else None

    async def mark_token_consumed(self, token: str) -> None:
        await self.session.execute(
            text(
                """
                UPDATE email_verification_tokens
                SET consumed_at = :consumed_at
                WHERE token = :token
                """
            ),
            {"token": token, "consumed_at": datetime.utcnow()},
        )
        await self.session.commit()

    def _row_to_user(self, row) -> User:
        return User(
            id=row[0],
            email=row[1],
            display_name=row[2],
            provider=row[3],
            provider_user_id=row[4],
            password_hash=row[5],
            is_active=row[6],
            email_verified_at=row[7],
            created_at=row[8],
            updated_at=row[9],
        )

    def _row_to_token(self, row) -> EmailVerificationToken:
        return EmailVerificationToken(
            token=row[0],
            user_id=row[1],
            expires_at=row[2],
            consumed_at=row[3],
            created_at=row[4],
        )
