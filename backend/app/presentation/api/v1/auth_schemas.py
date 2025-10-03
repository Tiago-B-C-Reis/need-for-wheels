from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Literal, Optional


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: Optional[str] = Field(default=None, max_length=255)


class RegisterResponse(BaseModel):
    message: str
    verification_token: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class VerifyEmailRequest(BaseModel):
    token: str


class OAuthRequest(BaseModel):
    provider: Literal["google", "apple"]
    token: Optional[str] = None
    token_type: Optional[Literal["id_token", "access_token"]] = None
    code: Optional[str] = None
    redirect_uri: Optional[str] = None

    @model_validator(mode="after")
    def ensure_credential(self) -> "OAuthRequest":
        if self.token is None and self.code is None:
            raise ValueError("Either token or code must be provided")
        return self


class OAuthResponse(TokenResponse):
    provider: str
    email: EmailStr
    display_name: Optional[str]
