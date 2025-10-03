from __future__ import annotations

from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ....core.config import settings
from ....infrastructure.db.database import SessionLocal
from ....infrastructure.repositories.user_repository_impl import SqlUserRepository
from ....application.services.security import PasswordHasher, TokenService
from ....application.services.oauth import OAuthVerifier
from ....application.services.email import EmailSender
from ....application.use_cases.register_user import RegisterUser
from ....application.use_cases.login_user import LoginUser
from ....application.use_cases.verify_email import VerifyEmail
from ....application.use_cases.oauth_sign_in import OAuthSignIn
from ....application.exceptions import (
    DuplicateEmailError,
    InvalidCredentialsError,
    EmailNotVerifiedError,
    VerificationTokenError,
    OAuthVerificationError,
    EmailDispatchError,
)
from .auth_schemas import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    TokenResponse,
    VerifyEmailRequest,
    OAuthRequest,
    OAuthResponse,
)


async def get_session() -> AsyncSession:
    async with SessionLocal() as session:
        yield session


def get_password_hasher() -> PasswordHasher:
    return PasswordHasher()


def get_token_service() -> TokenService:
    return TokenService(
        secret_key=settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
        access_token_expires_minutes=settings.jwt_access_token_exp_minutes,
    )


def get_oauth_verifier() -> OAuthVerifier:
    return OAuthVerifier(
        google_client_id=settings.google_client_id,
        apple_client_id=settings.apple_client_id,
    )


@lru_cache(maxsize=1)
def get_email_sender() -> EmailSender:
    if not settings.smtp_host or not settings.smtp_from_email:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email sending is not configured",
        )

    return EmailSender(
        host=settings.smtp_host,
        port=settings.smtp_port,
        from_email=settings.smtp_from_email,
        username=settings.smtp_username,
        password=settings.smtp_password,
        use_tls=settings.smtp_use_tls,
        use_ssl=settings.smtp_use_ssl,
        reply_to=settings.smtp_reply_to,
    )


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    payload: RegisterRequest,
    session: AsyncSession = Depends(get_session),
    hasher: PasswordHasher = Depends(get_password_hasher),
    email_sender: EmailSender = Depends(get_email_sender),
):
    repo = SqlUserRepository(session)
    use_case = RegisterUser(repo, hasher)
    try:
        _, token = await use_case.execute(
            email=payload.email,
            password=payload.password,
            display_name=payload.display_name,
        )
    except DuplicateEmailError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    try:
        await email_sender.send_verification_email(to_email=payload.email, token=token.token)
    except EmailDispatchError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    return RegisterResponse(
        message="Check your email for the verification code we just sent.",
        verification_token=token.token,
    )


@router.post("/login", response_model=TokenResponse)
async def login_user(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_session),
    hasher: PasswordHasher = Depends(get_password_hasher),
    token_service: TokenService = Depends(get_token_service),
):
    repo = SqlUserRepository(session)
    use_case = LoginUser(repo, hasher, token_service)
    try:
        tokens = await use_case.execute(email=payload.email, password=payload.password)
    except InvalidCredentialsError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    except EmailNotVerifiedError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc

    return TokenResponse(**tokens)


@router.post("/verify", response_model=dict)
async def verify_email(
    payload: VerifyEmailRequest,
    session: AsyncSession = Depends(get_session),
):
    repo = SqlUserRepository(session)
    use_case = VerifyEmail(repo)
    try:
        await use_case.execute(token=payload.token)
    except VerificationTokenError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return {"message": "Account created successfully."}


@router.post("/oauth", response_model=OAuthResponse)
async def oauth_sign_in(
    payload: OAuthRequest,
    session: AsyncSession = Depends(get_session),
    token_service: TokenService = Depends(get_token_service),
    verifier: OAuthVerifier = Depends(get_oauth_verifier),
):
    repo = SqlUserRepository(session)
    verify_kwargs = {"provider": payload.provider}
    if payload.token is not None:
        verify_kwargs["token"] = payload.token
        verify_kwargs["token_type"] = payload.token_type or "id_token"
    if payload.code is not None:
        verify_kwargs["code"] = payload.code
    if payload.redirect_uri is not None:
        verify_kwargs["redirect_uri"] = payload.redirect_uri
    try:
        verified = await verifier.verify(**verify_kwargs)
    except OAuthVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    provider_user_id = verified.get("provider_user_id")
    email = verified.get("email")
    if not provider_user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provider response missing required identifiers",
        )

    use_case = OAuthSignIn(repo, token_service)
    user, tokens = await use_case.execute(
        provider=verified["provider"],
        provider_user_id=provider_user_id,
        email=email,
        display_name=verified.get("display_name"),
    )

    return OAuthResponse(
        provider=user.provider,
        email=user.email,
        display_name=user.display_name,
        **tokens,
    )
