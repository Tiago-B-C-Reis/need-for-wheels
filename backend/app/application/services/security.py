from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Optional

from passlib.context import CryptContext
import jwt


class PasswordHasher:
    def __init__(self) -> None:
        self._ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def hash(self, password: str) -> str:
        return self._ctx.hash(password)

    def verify(self, password: str, hashed: str) -> bool:
        return self._ctx.verify(password, hashed)


class TokenService:
    def __init__(
        self,
        *,
        secret_key: str,
        algorithm: str,
        access_token_expires_minutes: int,
    ) -> None:
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.access_token_expires_minutes = access_token_expires_minutes

    def create_access_token(self, *, subject: str, extra: Optional[dict[str, Any]] = None) -> str:
        now = datetime.utcnow()
        exp = now + timedelta(minutes=self.access_token_expires_minutes)
        payload: dict[str, Any] = {"sub": subject, "iat": int(now.timestamp()), "exp": int(exp.timestamp())}
        if extra:
            payload.update(extra)
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def decode(self, token: str) -> dict[str, Any]:
        return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
