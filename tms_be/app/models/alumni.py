"""Database models for alumni."""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base
import enum as python_enum


class PrivacyLevel(str, python_enum.Enum):
    """Privacy levels for profile fields."""
    PUBLIC = "public"
    ALUMNI_ONLY = "alumni_only"
    PRIVATE = "private"


class Alumni(Base):
    """Alumni profile model."""
    __tablename__ = "alumni"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Basic Info
    name = Column(String(255), nullable=False)
    batch = Column(String(50), nullable=False, index=True)
    department = Column(String(100), nullable=False)
    roll_number = Column(String(50), nullable=True, unique=True)
    
    # Contact Info
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    
    # Professional Info
    profession = Column(String(100), nullable=True)
    company = Column(String(255), nullable=True)
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    
    # Additional Info
    bio = Column(Text, nullable=True)
    skills = Column(Text, nullable=True)  # JSON or comma-separated
    profile_photo = Column(String(500), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    github_url = Column(String(500), nullable=True)
    portfolio_url = Column(String(500), nullable=True)
    
    # Privacy Settings
    email_privacy = Column(Enum(PrivacyLevel), default=PrivacyLevel.ALUMNI_ONLY)
    phone_privacy = Column(Enum(PrivacyLevel), default=PrivacyLevel.PRIVATE)
    location_privacy = Column(Enum(PrivacyLevel), default=PrivacyLevel.ALUMNI_ONLY)
    
    # Notifications
    receive_emails = Column(Boolean, default=True)
    receive_event_notifications = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="alumni")


class AlumniSearch(Base):
    """Search suggestions for alumni."""
    __tablename__ = "alumni_search"

    id = Column(Integer, primary_key=True, index=True)
    alumni_id = Column(Integer, ForeignKey("alumni.id"), nullable=False)
    batch = Column(String(50), index=True)
    department = Column(String(100), index=True)
    profession = Column(String(100), index=True)
    country = Column(String(100), index=True)
    company = Column(String(255), index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
