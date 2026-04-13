"""Pydantic schemas for notices."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class NoticeCategoryRequest(BaseModel):
    """Notice category request."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class NoticeCategoryResponse(BaseModel):
    """Notice category response."""
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NoticeCreateRequest(BaseModel):
    """Create notice request."""
    title: str = Field(..., min_length=1, max_length=255)
    content: str
    category_id: Optional[int] = None
    image_url: Optional[str] = None
    expires_at: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "title": "New Alumni Directory Launched",
                "content": "We are excited to announce...",
                "category_id": 1,
                "image_url": "https://...",
            }
        }


class NoticeUpdateRequest(BaseModel):
    """Update notice request."""
    title: Optional[str] = None
    content: Optional[str] = None
    category_id: Optional[int] = None
    image_url: Optional[str] = None
    expires_at: Optional[datetime] = None
    is_published: Optional[bool] = None


class NoticeResponse(BaseModel):
    """Notice response."""
    id: int
    title: str
    content: str
    category_id: Optional[int] = None
    image_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_published: bool
    published_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    views: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NoticeListResponse(BaseModel):
    """Notice list response (minimal)."""
    id: int
    title: str
    thumbnail_url: Optional[str] = None
    is_published: bool
    published_at: Optional[datetime] = None
    views: int
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedNoticeResponse(BaseModel):
    """Paginated notices response."""
    items: List[NoticeListResponse]
    total: int
    skip: int
    limit: int
    page: int
    pages: int
