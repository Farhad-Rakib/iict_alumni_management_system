"""Database model for site settings."""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text

from app.db.base import Base


class SiteSetting(Base):
    """Key-value store for global site settings."""

    __tablename__ = "site_settings"

    id = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String(120), unique=True, nullable=False, index=True)
    setting_value = Column(JSON, nullable=False)
    description = Column(Text, nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
