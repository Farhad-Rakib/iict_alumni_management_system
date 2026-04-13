"""Pydantic schemas for alumni."""
from pydantic import BaseModel, EmailStr, HttpUrl, Field
from typing import Optional, List
from datetime import datetime
from app.models.alumni import PrivacyLevel


class AlumniCreateRequest(BaseModel):
    """Create alumni profile request."""
    name: str = Field(..., min_length=1, max_length=255)
    batch: str = Field(..., min_length=1, max_length=50)
    department: str = Field(..., min_length=1, max_length=100)
    roll_number: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    profession: Optional[str] = None
    company: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "John Doe",
                "batch": "2020",
                "department": "Computer Science",
                "roll_number": "CS20001",
                "email": "john@example.com",
                "phone": "+1234567890",
                "profession": "Software Engineer",
                "company": "Tech Company",
                "country": "USA",
                "city": "San Francisco",
                "bio": "Passionate developer",
                "skills": "Python, JavaScript, React",
            }
        }


class AlumniUpdateRequest(BaseModel):
    """Update alumni profile request."""
    name: Optional[str] = None
    profession: Optional[str] = None
    company: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    receive_emails: Optional[bool] = None
    receive_event_notifications: Optional[bool] = None

    class Config:
        json_schema_extra = {
            "example": {
                "profession": "Senior Software Engineer",
                "company": "Better Tech Company",
                "country": "Canada",
                "receive_emails": True,
            }
        }


class AlumniPrivacyUpdate(BaseModel):
    """Update privacy settings."""
    email_privacy: Optional[PrivacyLevel] = None
    phone_privacy: Optional[PrivacyLevel] = None
    location_privacy: Optional[PrivacyLevel] = None


class AlumniResponse(BaseModel):
    """Alumni profile response."""
    id: int
    user_id: int
    name: str
    batch: str
    department: str
    roll_number: Optional[str] = None
    email: str
    phone: Optional[str] = None
    profession: Optional[str] = None
    company: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    profile_photo: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    email_privacy: PrivacyLevel
    phone_privacy: PrivacyLevel
    location_privacy: PrivacyLevel
    receive_emails: bool
    receive_event_notifications: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AlumniListResponse(BaseModel):
    """Alumni list response (minimal info)."""
    id: int
    name: str
    batch: str
    department: str
    profession: Optional[str] = None
    company: Optional[str] = None
    country: Optional[str] = None
    profile_photo: Optional[str] = None

    class Config:
        from_attributes = True


class AlumniSearchRequest(BaseModel):
    """Alumni search request."""
    query: Optional[str] = None
    batch: Optional[str] = None
    department: Optional[str] = None
    profession: Optional[str] = None
    country: Optional[str] = None
    company: Optional[str] = None
    skip: int = Field(0, ge=0)
    limit: int = Field(20, ge=1, le=100)

    class Config:
        json_schema_extra = {
            "example": {
                "query": "software",
                "batch": "2020",
                "country": "USA",
                "skip": 0,
                "limit": 20,
            }
        }


class PaginatedAlumniResponse(BaseModel):
    """Paginated alumni response."""
    items: List[AlumniListResponse]
    total: int
    skip: int
    limit: int
    page: int
    pages: int

    class Config:
        json_schema_extra = {
            "example": {
                "items": [
                    {
                        "id": 1,
                        "name": "John Doe",
                        "batch": "2020",
                        "department": "CS",
                        "profession": "Software Engineer",
                        "company": "Tech Co",
                        "country": "USA",
                        "profile_photo": "https://...",
                    }
                ],
                "total": 100,
                "skip": 0,
                "limit": 20,
                "page": 1,
                "pages": 5,
            }
        }
