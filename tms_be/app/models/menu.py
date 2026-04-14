"""Database model for dynamic menu configuration."""
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class MenuItem(Base):
    """Menu item model supporting hierarchical, permission-aware navigation."""

    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(120), unique=True, nullable=False, index=True)
    label = Column(String(120), nullable=False)
    path = Column(String(255), nullable=True)
    icon = Column(String(80), nullable=True)
    parent_id = Column(Integer, ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=True, index=True)
    required_permissions = Column(JSON, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    badge = Column(String(60), nullable=True)
    badge_variant = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    parent = relationship("MenuItem", remote_side=[id], backref="children")
