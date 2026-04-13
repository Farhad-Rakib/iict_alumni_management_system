"""Service for authentication operations."""
from datetime import timedelta
from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.repositories.user import UserRepository
from app.models.user import LoginLog
from app.schemas.auth import (
    TokenResponse,
    SendOTPRequest,
    VerifyOTPRequest,
    SetPasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    ResetPasswordRequest,
    ForgotPasswordRequest,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.utils import generate_otp, generate_verification_token, get_utc_now
from app.core.config import settings
from app.services.email import EmailService


class AuthService:
    """Service for authentication operations."""

    def __init__(self, session: AsyncSession):
        self.user_repo = UserRepository(session)
        self.session = session

    async def send_otp(
        self,
        request: SendOTPRequest,
        background_tasks: BackgroundTasks | None = None,
    ) -> dict:
        """Send OTP to email."""
        user = await self.user_repo.get_by_email(request.email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not registered",
            )

        # Check if account is locked
        if user.is_locked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is locked. Contact administrator.",
            )

        # Generate OTP
        otp = generate_otp(settings.OTP_LENGTH)
        verification_token = generate_verification_token()
        user.otp = otp
        user.otp_created_at = get_utc_now()
        user.otp_attempts = 0
        user.verification_token = verification_token
        user.verification_token_expires_at = get_utc_now() + timedelta(
            hours=settings.VERIFICATION_LINK_EXPIRE_HOURS
        )

        await self.user_repo.commit()

        if background_tasks:
            background_tasks.add_task(
                EmailService.send_otp_and_verification_email,
                request.email,
                otp,
                verification_token,
            )

        return {"message": "OTP sent to email", "email": request.email}

    async def verify_otp(self, request: VerifyOTPRequest) -> dict:
        """Verify OTP and create verification token."""
        user = await self.user_repo.get_by_email(request.email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # Check if account is locked
        if user.is_locked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is locked due to too many failed attempts",
            )

        # Check if OTP is expired
        if not user.otp_created_at or not user.otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP not found or expired. Request a new OTP.",
            )

        otp_expiry = user.otp_created_at + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
        if get_utc_now() > otp_expiry:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP has expired. Request a new OTP.",
            )

        # Check OTP
        if user.otp != request.otp:
            user.otp_attempts += 1
            if user.otp_attempts >= settings.MAX_OTP_ATTEMPTS:
                user.is_locked = True
            await self.user_repo.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP",
            )

        # OTP verified - token already generated/sent in send_otp
        verification_token = user.verification_token
        if not verification_token:
            verification_token = generate_verification_token()
            user.verification_token = verification_token
            user.verification_token_expires_at = get_utc_now() + timedelta(
                hours=settings.VERIFICATION_LINK_EXPIRE_HOURS
            )

        user.otp = None
        user.otp_attempts = 0

        await self.user_repo.commit()

        return {
            "message": "OTP verified",
            "verification_token": verification_token,
        }

    async def set_password(self, request: SetPasswordRequest) -> dict:
        """Set password for new user."""
        user = await self.user_repo.get_by_email(request.email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # Check verification token
        if not user.verification_token or user.verification_token != request.verification_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token",
            )

        # Check if token is expired
        if (
            not user.verification_token_expires_at
            or get_utc_now() > user.verification_token_expires_at
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification token has expired",
            )

        # Set password
        user.password_hash = hash_password(request.password)
        user.is_verified = True
        user.is_active = True
        user.verification_token = None
        user.verification_token_expires_at = None
        user.password_changed_at = get_utc_now()

        await self.user_repo.commit()

        return {"message": "Password set successfully. You can now login."}

    async def login(self, request: LoginRequest) -> TokenResponse:
        """Authenticate user and return tokens."""
        user = await self.user_repo.get_by_email(request.email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        if not user.is_active:
            self.session.add(
                LoginLog(
                    user_id=user.id,
                    status="failed",
                    reason="inactive",
                )
            )
            await self.user_repo.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        if not user.password_hash:
            self.session.add(
                LoginLog(
                    user_id=user.id,
                    status="failed",
                    reason="missing_password",
                )
            )
            await self.user_repo.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        if not verify_password(request.password, user.password_hash):
            self.session.add(
                LoginLog(
                    user_id=user.id,
                    status="failed",
                    reason="invalid_password",
                )
            )
            await self.user_repo.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified",
            )

        # Update last login
        user.last_login = get_utc_now()
        self.session.add(
            LoginLog(
                user_id=user.id,
                status="success",
                reason="login_success",
            )
        )
        await self.user_repo.commit()

        # Create tokens
        access_token = create_access_token(
            subject=str(user.id),
            additional_claims={"role": user.role.value},
        )
        refresh_token = create_refresh_token(subject=str(user.id))

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def refresh_token(self, request: RefreshTokenRequest) -> TokenResponse:
        """Refresh access token using refresh token."""
        payload = decode_token(request.refresh_token)

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )

        user_id = payload.get("sub")
        user = await self.user_repo.get_by_id(int(user_id))

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        # Create new access token
        access_token = create_access_token(
            subject=str(user.id),
            additional_claims={"role": user.role.value},
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=request.refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def forgot_password(
        self,
        request: ForgotPasswordRequest,
        background_tasks: BackgroundTasks | None = None,
    ) -> dict:
        """Initiate forgot password process."""
        user = await self.user_repo.get_verified_by_email(request.email)

        if not user:
            # Don't reveal if email exists
            return {"message": "If the email exists, reset link will be sent"}

        # Generate verification token
        verification_token = generate_verification_token()
        user.verification_token = verification_token
        user.verification_token_expires_at = get_utc_now() + timedelta(
            hours=settings.VERIFICATION_LINK_EXPIRE_HOURS
        )

        await self.user_repo.commit()

        if background_tasks:
            background_tasks.add_task(
                EmailService.send_password_reset_email,
                request.email,
                verification_token,
            )

        return {"message": "Password reset link sent to email"}

    async def reset_password(self, request: ResetPasswordRequest) -> dict:
        """Reset password using token."""
        user = await self.user_repo.get_by_email(request.email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # Check verification token
        if not user.verification_token or user.verification_token != request.verification_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token",
            )

        # Check if token is expired
        if (
            not user.verification_token_expires_at
            or get_utc_now() > user.verification_token_expires_at
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired",
            )

        # Update password
        user.password_hash = hash_password(request.new_password)
        user.verification_token = None
        user.verification_token_expires_at = None
        user.password_changed_at = get_utc_now()

        await self.user_repo.commit()

        return {"message": "Password reset successfully"}
