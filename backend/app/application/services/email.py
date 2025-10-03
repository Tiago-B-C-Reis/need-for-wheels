from __future__ import annotations

import asyncio
import smtplib
import ssl
from email.message import EmailMessage
from typing import Optional

from ..exceptions import EmailDispatchError


class EmailSender:
    def __init__(
        self,
        *,
        host: str,
        port: int,
        from_email: str,
        username: Optional[str] = None,
        password: Optional[str] = None,
        use_tls: bool = True,
        use_ssl: bool = False,
        reply_to: Optional[str] = None,
    ) -> None:
        if not host:
            raise ValueError("SMTP host must be provided")
        if not from_email:
            raise ValueError("From email must be provided")

        self.host = host
        self.port = port
        self.from_email = from_email
        self.username = username
        self.password = password
        self.use_tls = use_tls
        self.use_ssl = use_ssl
        self.reply_to = reply_to

    async def send_verification_email(self, *, to_email: str, token: str) -> None:
        subject = "Verify your Need for Wheels account"
        text_body = (
            "Hi,\n\n"
            "Thanks for creating an account with Need for Wheels. "
            "Use the verification code below to activate your profile.\n\n"
            f"Verification code: {token}\n\n"
            "This code expires in 24 hours. If you did not request this, you can ignore this email.\n"
        )
        html_body = (
            "<p>Hi,</p>"
            "<p>Thanks for creating an account with Need for Wheels. Use the verification code below to activate your profile.</p>"
            f"<p style=\"font-size:20px;font-weight:bold;letter-spacing:3px\">{token}</p>"
            "<p>This code expires in 24 hours. If you did not request this, you can ignore this email.</p>"
        )

        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = self.from_email
        message["To"] = to_email
        if self.reply_to:
            message["Reply-To"] = self.reply_to
        message.set_content(text_body)
        message.add_alternative(html_body, subtype="html")

        await self._send(message)

    async def _send(self, message: EmailMessage) -> None:
        loop = asyncio.get_running_loop()
        try:
            await loop.run_in_executor(None, self._send_sync, message)
        except EmailDispatchError:
            raise
        except Exception as exc:  # pragma: no cover - best effort logging
            raise EmailDispatchError("Unable to send verification email") from exc

    def _send_sync(self, message: EmailMessage) -> None:
        context = ssl.create_default_context()
        try:
            if self.use_ssl:
                with smtplib.SMTP_SSL(self.host, self.port, context=context) as server:
                    self._login_and_send(server, message)
            else:
                with smtplib.SMTP(self.host, self.port, timeout=15) as server:
                    server.ehlo()
                    if self.use_tls:
                        server.starttls(context=context)
                        server.ehlo()
                    self._login_and_send(server, message)
        except Exception as exc:  # pragma: no cover - smtplib raises many types
            raise EmailDispatchError("SMTP server rejected the email") from exc

    def _login_and_send(self, server: smtplib.SMTP, message: EmailMessage) -> None:
        if self.username and self.password:
            server.login(self.username, self.password)
        server.send_message(message)

