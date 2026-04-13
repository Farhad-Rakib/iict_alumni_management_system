"""Authentication API routes."""
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import get_db_session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.auth import (
    TokenResponse,
    SendOTPRequest,
    VerifyOTPRequest,
    SetPasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    ResetPasswordRequest,
    ForgotPasswordRequest,
    UserResponse,
    CurrentUserResponse,
)
from app.services.auth import AuthService
from app.services.rbac import RBACService

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/send-otp", response_model=dict)
async def send_otp(
    request: SendOTPRequest,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db_session),
):
    """Send OTP to email for verification."""
    auth_service = AuthService(session)
    return await auth_service.send_otp(request, background_tasks)


@router.post("/verify-otp", response_model=dict)
async def verify_otp(
    request: VerifyOTPRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Verify OTP and get verification token."""
    auth_service = AuthService(session)
    return await auth_service.verify_otp(request)


@router.post("/set-password", response_model=dict)
async def set_password(
    request: SetPasswordRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Set password for new user after email verification."""
    auth_service = AuthService(session)
    return await auth_service.set_password(request)


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Login with email and password."""
    auth_service = AuthService(session)
    return await auth_service.login(request)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Refresh access token using refresh token."""
    auth_service = AuthService(session)
    return await auth_service.refresh_token(request)


@router.post("/forgot-password", response_model=dict)
async def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db_session),
):
    """Request password reset email."""
    auth_service = AuthService(session)
    return await auth_service.forgot_password(request, background_tasks)


@router.post("/reset-password", response_model=dict)
async def reset_password(
    request: ResetPasswordRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Reset password using reset token."""
    auth_service = AuthService(session)
    return await auth_service.reset_password(request)


@router.get("/me", response_model=CurrentUserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Get current authenticated user info."""
    rbac_service = RBACService(session)
    permissions = sorted(list(await rbac_service.get_effective_permissions(current_user)))
    return CurrentUserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        role=current_user.role,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        is_locked=current_user.is_locked,
        last_login=current_user.last_login,
        created_at=current_user.created_at,
        permissions=permissions,
    )
