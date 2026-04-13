"""Email delivery helpers with background task support."""
from __future__ import annotations

import asyncio
import smtplib
from email.message import EmailMessage

from app.core.config import settings


class EmailService:
    """Service for sending transactional emails."""

    @staticmethod
    async def send_email(subject: str, recipient: str, body: str) -> None:
        """Send an email asynchronously using SMTP settings."""
        await asyncio.to_thread(EmailService._send_email_sync, subject, recipient, body)

    @staticmethod
    def _send_email_sync(subject: str, recipient: str, body: str) -> None:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = settings.SENDER_EMAIL
        msg["To"] = recipient
        msg.set_content(body)

        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            # In local/dev without SMTP credentials configured, keep auth flow non-blocking.
            print(f"[email:skipped] to={recipient} subject={subject}")
            return

        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as smtp:
            smtp.starttls()
            smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(msg)

    @staticmethod
    async def send_otp_and_verification_email(
        recipient: str,
        otp: str,
        verification_token: str,
    ) -> None:
        verification_link = f"{settings.FRONTEND_VERIFY_URL}?token={verification_token}&email={recipient}"
        body = (
            "Your Alumni Portal verification details:\n\n"
            f"OTP: {otp}\n"
            f"OTP expires in {settings.OTP_EXPIRE_MINUTES} minutes.\n\n"
            f"Verification link (expires in {settings.VERIFICATION_LINK_EXPIRE_HOURS} hours):\n"
            f"{verification_link}\n"
        )
        await EmailService.send_email("Verify your alumni account", recipient, body)

    @staticmethod
    async def send_password_reset_email(recipient: str, verification_token: str) -> None:
        reset_link = f"{settings.FRONTEND_RESET_URL}?token={verification_token}&email={recipient}"
        body = (
            "You requested a password reset for your Alumni Portal account.\n\n"
            f"Reset link (expires in {settings.VERIFICATION_LINK_EXPIRE_HOURS} hours):\n"
            f"{reset_link}\n"
        )
        await EmailService.send_email("Reset your alumni account password", recipient, body)
