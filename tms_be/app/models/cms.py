"""Database models for CMS."""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base


class CMSPage(Base):
    """CMS Page model."""
    __tablename__ = "cms_pages"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(String(500), nullable=True)
    meta_keywords = Column(String(500), nullable=True)
    
    is_published = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class Slider(Base):
    """Homepage slider images."""
    __tablename__ = "sliders"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=False)
    link_url = Column(String(500), nullable=True)
    
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class Committee(Base):
    """Committee member model."""
    __tablename__ = "committees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    position = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    
    photo_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    
    department = Column(String(100), nullable=True)
    tenure_start = Column(DateTime, nullable=True)
    tenure_end = Column(DateTime, nullable=True)
    
    is_active = Column(Boolean, default=True)
    order = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class Gallery(Base):
    """Gallery image model."""
    __tablename__ = "gallery"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    
    album = Column(String(100), nullable=True, index=True)  # e.g., "Annual Meet 2024"
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class ContactInfo(Base):
    """Contact information model."""
    __tablename__ = "contact_info"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    
    # Contact details
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    website = Column(String(255), nullable=True)
    
    # Address
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    
    # Social media
    facebook = Column(String(255), nullable=True)
    twitter = Column(String(255), nullable=True)
    linkedin = Column(String(255), nullable=True)
    instagram = Column(String(255), nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
