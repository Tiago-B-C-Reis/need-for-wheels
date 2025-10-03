from __future__ import annotations

import json
from datetime import datetime, timedelta
from typing import Any, Optional

import httpx
import jwt
from jwt import jwk_from_dict
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from ..exceptions import OAuthVerificationError


class OAuthVerifier:
    def __init__(
        self,
        *,
        google_client_id: Optional[str] = None,
        apple_client_id: Optional[str] = None,
        apple_keys_url: str = "https://appleid.apple.com/auth/keys",
        apple_cache_ttl_hours: int = 6,
    ) -> None:
        self.google_client_id = google_client_id
        self.apple_client_id = apple_client_id
        self.apple_keys_url = apple_keys_url
        self.apple_cache_ttl = timedelta(hours=apple_cache_ttl_hours)
        self._apple_keys: dict[str, Any] | None = None
        self._apple_keys_expiry: Optional[datetime] = None

    async def verify(
        self,
        *,
        provider: str,
        token: str | None = None,
        token_type: str = "id_token",
        code: str | None = None,
        redirect_uri: str | None = None,
    ) -> dict[str, Any]:
        provider = provider.lower()
        if provider == "google":
            if token:
                return await self._verify_google(token, token_type=token_type)
            if code:
                raise OAuthVerificationError("Google authorization code exchange is not configured")
            raise OAuthVerificationError("Google token missing")
        if provider == "apple":
            if token:
                return await self._verify_apple(token)
            if code:
                raise OAuthVerificationError("Apple authorization code exchange is not configured")
            raise OAuthVerificationError("Apple token missing")
        raise OAuthVerificationError(f"Unsupported provider: {provider}")

    async def _verify_google(self, token: str, *, token_type: str = "id_token") -> dict[str, Any]:
        if token_type == "access_token":
            return await self._verify_google_access_token(token)
        try:
            idinfo = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                audience=self.google_client_id,
            )
        except ValueError as exc:
            raise OAuthVerificationError("Invalid Google identity token") from exc

        email = idinfo.get("email")
        if not email:
            raise OAuthVerificationError("Google token missing email")
        if not idinfo.get("email_verified", True):
            raise OAuthVerificationError("Google email not verified")

        return {
            "provider": "google",
            "provider_user_id": idinfo.get("sub"),
            "email": email,
            "display_name": idinfo.get("name"),
        }

    async def _verify_google_access_token(self, token: str) -> dict[str, Any]:
        userinfo_endpoint = "https://www.googleapis.com/oauth2/v3/userinfo"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    userinfo_endpoint,
                    headers={"Authorization": f"Bearer {token}"},
                )
                resp.raise_for_status()
                data = resp.json()
        except httpx.HTTPError as exc:
            raise OAuthVerificationError("Unable to validate Google access token") from exc

        email = data.get("email")
        if not email:
            raise OAuthVerificationError("Google profile missing email")
        if not data.get("email_verified", True):
            raise OAuthVerificationError("Google email not verified")

        return {
            "provider": "google",
            "provider_user_id": data.get("sub") or data.get("id") or email,
            "email": email,
            "display_name": data.get("name"),
        }

    async def _verify_apple(self, token: str) -> dict[str, Any]:
        try:
            headers = jwt.get_unverified_header(token)
            kid = headers.get("kid")
            if not kid:
                raise OAuthVerificationError("Apple token missing key id")
            key = await self._get_apple_key(kid)
            if key is None:
                raise OAuthVerificationError("Apple signing key not found")

            try:
                jwk = jwk_from_dict(key)
                public_key = jwk.key
            except Exception as exc:  # pragma: no cover - jwk parsing errors are rare
                raise OAuthVerificationError("Unable to parse Apple signing key") from exc
            options = {"verify_aud": self.apple_client_id is not None}
            decoded = jwt.decode(
                token,
                key=public_key,
                algorithms=["RS256"],
                audience=self.apple_client_id,
                options=options,
            )
        except (jwt.PyJWTError, OAuthVerificationError) as exc:
            if isinstance(exc, OAuthVerificationError):
                raise
            raise OAuthVerificationError("Invalid Apple identity token") from exc

        email = decoded.get("email")
        if not email:
            raise OAuthVerificationError("Apple token missing email")

        return {
            "provider": "apple",
            "provider_user_id": decoded.get("sub"),
            "email": email.lower(),
            "display_name": decoded.get("name"),
        }

    async def _get_apple_key(self, kid: str) -> Optional[dict[str, Any]]:
        keys = await self._get_apple_keys()
        return keys.get(kid)

    async def _get_apple_keys(self) -> dict[str, Any]:
        now = datetime.utcnow()
        if self._apple_keys and self._apple_keys_expiry and self._apple_keys_expiry > now:
            return self._apple_keys

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(self.apple_keys_url)
                resp.raise_for_status()
                payload = resp.json()
        except httpx.HTTPError as exc:
            raise OAuthVerificationError("Unable to fetch Apple signing keys") from exc

        keys = {item["kid"]: item for item in payload.get("keys", []) if "kid" in item}
        self._apple_keys = keys
        self._apple_keys_expiry = now + self.apple_cache_ttl
        return keys
