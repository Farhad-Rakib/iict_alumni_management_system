"""Database models for notices."""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base


class NoticeCategory(Base):
    """Notice category model."""
    __tablename__ = "notice_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class Notice(Base):
    """Notice/News model."""
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category_id = Column(Integer, ForeignKey("notice_categories.id"), nullable=True)
    
    image_url = Column(String(500), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    
    is_published = Column(Boolean, default=False)
    published_at = Column(DateTime, nullable=True)
    
    # Expiry
    expires_at = Column(DateTime, nullable=True)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Engagement
    views = Column(Integer, default=0)

    # Relationships
    notifications = relationship("NoticeNotification", back_populates="notice", cascade="all, delete-orphan")


class NoticeNotification(Base):
    """Track notice notifications sent to users."""
    __tablename__ = "notice_notifications"

    id = Column(Integer, primary_key=True, index=True)
    notice_id = Column(Integer, ForeignKey("notices.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    read_at = Column(DateTime, nullable=True)

    notice = relationship("Notice", back_populates="notifications")
