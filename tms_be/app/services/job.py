"""Service for job operations."""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.repositories.base import BaseRepository
from app.models.job import Job, JobApplication
from app.schemas.job import (
    JobCreateRequest,
    JobUpdateRequest,
    JobResponse,
    JobListResponse,
    JobApplicationRequest,
    JobApplicationResponse,
    PaginatedJobResponse,
)
from app.core.utils import get_utc_now


class JobRepository(BaseRepository[Job]):
    """Repository for Job operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, Job)

    async def get_active_jobs(self, skip: int = 0, limit: int = 20) -> tuple[list[Job], int]:
        """Get active job listings."""
        query = select(self.model).where(self.model.is_active == True)
        count_result = await self.session.execute(
            select(func.count(self.model.id)).where(self.model.is_active == True)
        )
        total = count_result.scalar() or 0

        result = await self.session.execute(query.offset(skip).limit(limit))
        return result.scalars().all(), total


class JobApplicationRepository(BaseRepository[JobApplication]):
    """Repository for Job Application operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, JobApplication)

    async def get_by_job_and_user(self, job_id: int, user_id: int) -> JobApplication | None:
        """Get application for specific job and user."""
        result = await self.session.execute(
            select(self.model).where(
                (self.model.job_id == job_id) & (self.model.user_id == user_id)
            )
        )
        return result.scalar_one_or_none()

    async def get_by_job(self, job_id: int) -> list[JobApplication]:
        """Get all applications for a job."""
        result = await self.session.execute(
            select(self.model).where(self.model.job_id == job_id)
        )
        return result.scalars().all()


class JobService:
    """Service for job operations."""

    def __init__(self, session: AsyncSession):
        self.job_repo = JobRepository(session)
        self.app_repo = JobApplicationRepository(session)
        self.session = session

    async def create_job(self, request: JobCreateRequest, user_id: int) -> JobResponse:
        """Create a new job listing."""
        job_data = request.model_dump()
        job_data["posted_by"] = user_id

        job = await self.job_repo.create(job_data)
        await self.job_repo.commit()

        return job

    async def get_job_by_id(self, job_id: int) -> JobResponse:
        """Get job by ID."""
        job = await self.job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )
        return job

    async def update_job(self, job_id: int, request: JobUpdateRequest, user_id: int) -> JobResponse:
        """Update job listing."""
        job = await self.job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        update_data = request.model_dump(exclude_unset=True)
        updated_job = await self.job_repo.update(job_id, update_data)
        await self.job_repo.commit()

        return updated_job

    async def list_jobs(self, skip: int = 0, limit: int = 20) -> PaginatedJobResponse:
        """List active job listings."""
        jobs, total = await self.job_repo.get_active_jobs(skip=skip, limit=limit)

        items = [JobListResponse.model_validate(j) for j in jobs]

        return PaginatedJobResponse(
            items=items,
            total=total,
            skip=skip,
            limit=limit,
            page=(skip // limit) + 1 if limit > 0 else 1,
            pages=(total + limit - 1) // limit if limit > 0 else 0,
        )

    async def delete_job(self, job_id: int) -> None:
        """Delete job listing."""
        job = await self.job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        await self.job_repo.delete(job_id)
        await self.job_repo.commit()

    async def apply_job(
        self,
        job_id: int,
        user_id: int,
        request: JobApplicationRequest,
    ) -> JobApplicationResponse:
        """Apply for a job."""
        job = await self.job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        # Check if already applied
        existing = await self.app_repo.get_by_job_and_user(job_id, user_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already applied for this job",
            )

        app_data = request.model_dump()
        app_data["job_id"] = job_id
        app_data["user_id"] = user_id

        application = await self.app_repo.create(app_data)
        await self.app_repo.commit()

        return application

    async def get_job_applications(self, job_id: int) -> list[JobApplicationResponse]:
        """Get applications for a job."""
        job = await self.job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        applications = await self.app_repo.get_by_job(job_id)
        return [JobApplicationResponse.model_validate(a) for a in applications]
