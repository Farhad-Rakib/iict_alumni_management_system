"""Pydantic schemas for CMS."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class PageCreateRequest(BaseModel):
    """Create CMS page request."""
    slug: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=255)
    content: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None


class PageUpdateRequest(BaseModel):
    """Update CMS page request."""
    title: Optional[str] = None
    content: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    is_published: Optional[bool] = None


class PageResponse(BaseModel):
    """CMS page response."""
    id: int
    slug: str
    title: str
    content: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    is_published: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SliderCreateRequest(BaseModel):
    """Create slider request."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    image_url: str
    link_url: Optional[str] = None
    order: int = 0


class SliderUpdateRequest(BaseModel):
    """Update slider request."""
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class SliderResponse(BaseModel):
    """Slider response."""
    id: int
    title: str
    description: Optional[str] = None
    image_url: str
    link_url: Optional[str] = None
    order: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CommitteeCreateRequest(BaseModel):
    """Create committee member request."""
    name: str = Field(..., min_length=1, max_length=255)
    position: str = Field(..., min_length=1, max_length=100)
    email: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    department: Optional[str] = None


class CommitteeUpdateRequest(BaseModel):
    """Update committee member request."""
    name: Optional[str] = None
    position: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None
    order: Optional[int] = None


class CommitteeResponse(BaseModel):
    """Committee member response."""
    id: int
    name: str
    position: str
    email: str
    phone: Optional[str] = None
    photo_url: Optional[str] = None
    bio: Optional[str] = None
    department: Optional[str] = None
    is_active: bool
    order: int
    created_at: datetime

    class Config:
        from_attributes = True


class GalleryCreateRequest(BaseModel):
    """Create gallery image request."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    image_url: str
    album: Optional[str] = None


class GalleryResponse(BaseModel):
    """Gallery image response."""
    id: int
    title: str
    description: Optional[str] = None
    image_url: str
    thumbnail_url: Optional[str] = None
    album: Optional[str] = None
    order: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ContactInfoResponse(BaseModel):
    """Contact information response."""
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    facebook: Optional[str] = None
    twitter: Optional[str] = None
    linkedin: Optional[str] = None
    instagram: Optional[str] = None

    class Config:
        from_attributes = True
