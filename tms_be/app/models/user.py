"""Database models for authentication and users."""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base
import enum as python_enum


class RoleEnum(str, python_enum.Enum):
    """User roles."""
    SUPER_ADMIN = "superadmin"
    ADMIN = "admin"
    ALUMNI = "alumni"
    EVENT_MANAGER = "event_manager"
    ELECTION_MANAGER = "election_manager"


class User(Base):
    """User model."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=True)  # Null for new users
    role = Column(Enum(RoleEnum), default=RoleEnum.ALUMNI, nullable=False)
    
    # Account status
    is_active = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    is_locked = Column(Boolean, default=False)
    
    # OTP and verification
    otp = Column(String(6), nullable=True)
    otp_attempts = Column(Integer, default=0)
    otp_created_at = Column(DateTime, nullable=True)
    verification_token = Column(String(255), nullable=True, unique=True)
    verification_token_expires_at = Column(DateTime, nullable=True)
    
    # Timestamps
    last_login = Column(DateTime, nullable=True)
    password_changed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    alumni = relationship("Alumni", back_populates="user", uselist=False, cascade="all, delete-orphan")
    login_logs = relationship("LoginLog", back_populates="user", cascade="all, delete-orphan")
    voting_logs = relationship("VotingLog", back_populates="user", cascade="all, delete-orphan")


class LoginLog(Base):
    """Login audit log."""
    __tablename__ = "login_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    status = Column(String(20), default="success")  # success, failed
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="login_logs")


class Permission(Base):
    """Permission model."""
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(String(500), nullable=True)
    resource = Column(String(100), nullable=False)  # e.g., "alumni", "events"
    action = Column(String(50), nullable=False)  # e.g., "create", "read", "update", "delete"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
