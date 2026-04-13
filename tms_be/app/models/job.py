"""Database models for jobs."""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base


class Job(Base):
    """Job listing model."""
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    job_type = Column(String(50), nullable=False)  # Full-time, Part-time, Contract, Internship
    
    # Requirements
    required_skills = Column(Text, nullable=True)  # JSON array
    experience_level = Column(String(50), nullable=True)  # Entry, Mid, Senior
    experience_years = Column(Integer, nullable=True)
    
    # Application
    apply_link = Column(String(500), nullable=False)
    apply_internally = Column(Boolean, default=False)
    
    # Expiry
    posted_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Metadata
    posted_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    applications = relationship("JobApplication", back_populates="job", cascade="all, delete-orphan")


class JobApplication(Base):
    """Job application model."""
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    resume_url = Column(String(500), nullable=True)
    cover_letter = Column(Text, nullable=True)
    status = Column(String(20), default="applied")  # applied, shortlisted, rejected, accepted
    
    applied_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    job = relationship("Job", back_populates="applications")
