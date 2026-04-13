"""Jobs API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import get_db_session
from app.dependencies.auth import get_current_user, require_permission
from app.models.user import User
from app.schemas.job import (
    JobCreateRequest,
    JobUpdateRequest,
    JobResponse,
    JobListResponse,
    JobApplicationRequest,
    JobApplicationResponse,
    PaginatedJobResponse,
)
from app.services.job import JobService

router = APIRouter(prefix="/api/v1/jobs", tags=["Jobs"])


@router.post("/", response_model=JobResponse, dependencies=[Depends(require_permission("jobs.create"))])
async def create_job(
    request: JobCreateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Create a new job listing."""
    job_service = JobService(session)
    return await job_service.create_job(request, current_user.id)


@router.get("/", response_model=PaginatedJobResponse)
async def list_jobs(
    skip: int = 0,
    limit: int = 20,
    session: AsyncSession = Depends(get_db_session),
):
    """List active job listings."""
    job_service = JobService(session)
    return await job_service.list_jobs(skip=skip, limit=limit)


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: int,
    session: AsyncSession = Depends(get_db_session),
):
    """Get job details."""
    job_service = JobService(session)
    return await job_service.get_job_by_id(job_id)


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    request: JobUpdateRequest,
    current_user: User = Depends(require_permission("jobs.edit")),
    session: AsyncSession = Depends(get_db_session),
):
    """Update job listing."""
    job_service = JobService(session)
    return await job_service.update_job(job_id, request, current_user.id)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: int,
    current_user: User = Depends(require_permission("jobs.delete")),
    session: AsyncSession = Depends(get_db_session),
):
    """Delete a job listing."""
    job_service = JobService(session)
    await job_service.delete_job(job_id)


@router.post("/{job_id}/apply", response_model=JobApplicationResponse)
async def apply_job(
    job_id: int,
    request: JobApplicationRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Apply for a job."""
    job_service = JobService(session)
    return await job_service.apply_job(job_id, current_user.id, request)


@router.get("/{job_id}/applications", response_model=list[JobApplicationResponse])
async def get_job_applications(
    job_id: int,
    current_user: User = Depends(require_permission("jobs.view_applications")),
    session: AsyncSession = Depends(get_db_session),
):
    """Get applications for a job."""
    job_service = JobService(session)
    return await job_service.get_job_applications(job_id)
