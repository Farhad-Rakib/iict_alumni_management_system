"""Pydantic schemas for jobs."""
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from datetime import datetime


class JobCreateRequest(BaseModel):
    """Create job listing request."""
    title: str = Field(..., min_length=1, max_length=255)
    description: str
    company: str = Field(..., min_length=1, max_length=255)
    location: Optional[str] = None
    job_type: str  # Full-time, Part-time, Contract, Internship
    required_skills: Optional[str] = None
    experience_level: Optional[str] = None  # Entry, Mid, Senior
    experience_years: Optional[int] = None
    apply_link: str
    apply_internally: bool = False
    expires_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Senior Python Developer",
                "description": "We are looking for...",
                "company": "Tech Company",
                "location": "New York, USA",
                "job_type": "Full-time",
                "required_skills": "Python, Django, PostgreSQL",
                "experience_level": "Senior",
                "experience_years": 5,
                "apply_link": "https://careers.company.com/job/123",
                "apply_internally": False,
                "expires_at": "2024-12-31T23:59:59",
            }
        }


class JobUpdateRequest(BaseModel):
    """Update job listing request."""
    title: Optional[str] = None
    description: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    required_skills: Optional[str] = None
    experience_level: Optional[str] = None
    experience_years: Optional[int] = None
    apply_link: Optional[str] = None
    apply_internally: Optional[bool] = None
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None


class JobResponse(BaseModel):
    """Job response."""
    id: int
    title: str
    description: str
    company: str
    location: Optional[str] = None
    job_type: str
    required_skills: Optional[str] = None
    experience_level: Optional[str] = None
    experience_years: Optional[int] = None
    apply_link: str
    apply_internally: bool
    posted_date: datetime
    expires_at: datetime
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JobListResponse(BaseModel):
    """Job list response (minimal)."""
    id: int
    title: str
    company: str
    location: Optional[str] = None
    job_type: str
    experience_level: Optional[str] = None
    posted_date: datetime
    expires_at: datetime

    class Config:
        from_attributes = True


class JobApplicationRequest(BaseModel):
    """Apply for job request."""
    resume_url: Optional[str] = None
    cover_letter: Optional[str] = None


class JobApplicationResponse(BaseModel):
    """Job application response."""
    id: int
    job_id: int
    user_id: int
    resume_url: Optional[str] = None
    cover_letter: Optional[str] = None
    status: str
    applied_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaginatedJobResponse(BaseModel):
    """Paginated jobs response."""
    items: List[JobListResponse]
    total: int
    skip: int
    limit: int
    page: int
    pages: int
