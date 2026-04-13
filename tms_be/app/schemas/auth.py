"""Pydantic schemas for authentication."""
from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Optional
from datetime import datetime
from app.models.user import RoleEnum


class TokenResponse(BaseModel):
    """Token response model."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGc...",
                "refresh_token": "eyJhbGc...",
                "token_type": "bearer",
                "expires_in": 1800,
            }
        }


class SendOTPRequest(BaseModel):
    """Send OTP request."""
    email: EmailStr

    class Config:
        json_schema_extra = {"example": {"email": "alumni@example.com"}}


class VerifyOTPRequest(BaseModel):
    """Verify OTP request."""
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

    class Config:
        json_schema_extra = {"example": {"email": "alumni@example.com", "otp": "123456"}}


class SetPasswordRequest(BaseModel):
    """Set password for new user."""
    email: EmailStr
    verification_token: str
    password: str = Field(..., min_length=8)
    password_confirm: str

    @model_validator(mode="after")
    def validate_password_confirmation(self) -> "SetPasswordRequest":
        if self.password != self.password_confirm:
            raise ValueError("Passwords do not match")
        return self

    class Config:
        json_schema_extra = {
            "example": {
                "email": "alumni@example.com",
                "verification_token": "abc123...",
                "password": "SecurePass123",
                "password_confirm": "SecurePass123",
            }
        }


class LoginRequest(BaseModel):
    """User login request."""
    email: EmailStr
    password: str

    class Config:
        json_schema_extra = {
            "example": {"email": "alumni@example.com", "password": "SecurePass123"}
        }


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""
    refresh_token: str

    class Config:
        json_schema_extra = {"example": {"refresh_token": "eyJhbGc..."}}


class ForgotPasswordRequest(BaseModel):
    """Forgot password request."""
    email: EmailStr

    class Config:
        json_schema_extra = {"example": {"email": "alumni@example.com"}}


class ResetPasswordRequest(BaseModel):
    """Reset password request."""
    email: EmailStr
    verification_token: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str

    @model_validator(mode="after")
    def validate_password_confirmation(self) -> "ResetPasswordRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self

    class Config:
        json_schema_extra = {
            "example": {
                "email": "alumni@example.com",
                "verification_token": "abc123...",
                "new_password": "NewSecurePass123",
                "confirm_password": "NewSecurePass123",
            }
        }


class UserResponse(BaseModel):
    """User response model."""
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: RoleEnum
    is_active: bool
    is_verified: bool
    is_locked: bool
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "email": "alumni@example.com",
                "full_name": "John Doe",
                "phone": "+1234567890",
                "role": "alumni",
                "is_active": True,
                "is_verified": True,
                "is_locked": False,
                "last_login": "2024-01-15T10:30:00",
                "created_at": "2024-01-01T08:00:00",
            }
        }


class CurrentUserResponse(UserResponse):
    """Current logged-in user response."""
    permissions: list[str] = Field(default_factory=list)
