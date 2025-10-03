class DuplicateEmailError(Exception):
    """Raised when trying to register with an email that already exists."""


class InvalidCredentialsError(Exception):
    """Raised when provided credentials are invalid."""


class EmailNotVerifiedError(Exception):
    """Raised when attempting login before email verification."""


class VerificationTokenError(Exception):
    """Raised when an email verification token is missing, expired, or already used."""


class OAuthVerificationError(Exception):
    """Raised when third-party identity tokens cannot be verified."""


class EmailDispatchError(Exception):
    """Raised when verification emails fail to send."""
