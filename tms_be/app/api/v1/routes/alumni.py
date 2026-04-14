"""Alumni API routes."""
from fastapi import APIRouter, Depends, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import get_db_session
from app.dependencies.auth import get_current_user, require_permission
from app.models.user import User
from app.schemas.alumni import (
    AlumniCreateRequest,
    AlumniUpdateRequest,
    AlumniResponse,
    PaginatedAlumniResponse,
)
from app.services.alumni import AlumniService

router = APIRouter(prefix="/api/v1/alumni", tags=["Alumni"])


@router.post(
    "/create",
    response_model=dict,
    dependencies=[Depends(require_permission("alumni.create"))],
)
async def create_alumni(
    request: AlumniCreateRequest,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_db_session),
):
    """Create a new alumni profile (Admin only)."""
    alumni_service = AlumniService(session)
    return await alumni_service.create_alumni(request, background_tasks)


@router.get(
    "/directory",
    response_model=PaginatedAlumniResponse,
    dependencies=[Depends(require_permission("alumni.read"))],
)
async def get_alumni_directory(
    skip: int = 0,
    limit: int = 20,
    batch: str = None,
    department: str = None,
    profession: str = None,
    country: str = None,
    company: str = None,
    session: AsyncSession = Depends(get_db_session),
):
    """Search and filter alumni directory."""
    alumni_service = AlumniService(session)
    return await alumni_service.search_alumni(
        skip=skip,
        limit=limit,
        batch=batch,
        department=department,
        profession=profession,
        country=country,
        company=company,
    )


@router.get(
    "/{alumni_id}",
    response_model=AlumniResponse,
    dependencies=[Depends(require_permission("alumni.read"))],
)
async def get_alumni(
    alumni_id: int,
    session: AsyncSession = Depends(get_db_session),
):
    """Get alumni profile by ID."""
    alumni_service = AlumniService(session)
    return await alumni_service.get_alumni_by_id(alumni_id)


@router.get("/profile/me", response_model=AlumniResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Get current user's alumni profile."""
    alumni_service = AlumniService(session)
    return await alumni_service.get_alumni_by_user_id(current_user.id)


@router.put("/profile/me", response_model=AlumniResponse)
async def update_my_profile(
    request: AlumniUpdateRequest,
    current_user: User = Depends(require_permission("alumni.profile.edit")),
    session: AsyncSession = Depends(get_db_session),
):
    """Update current user's alumni profile."""
    alumni_service = AlumniService(session)
    return await alumni_service.update_alumni_by_user_id(current_user.id, request)


@router.put("/{alumni_id}", response_model=AlumniResponse)
async def update_alumni(
    alumni_id: int,
    request: AlumniUpdateRequest,
    current_user: User = Depends(require_permission("alumni.edit")),
    session: AsyncSession = Depends(get_db_session),
):
    """Update alumni profile (Admin only)."""
    alumni_service = AlumniService(session)
    return await alumni_service.update_alumni(alumni_id, request)


@router.delete("/{alumni_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alumni(
    alumni_id: int,
    current_user: User = Depends(require_permission("alumni.delete")),
    session: AsyncSession = Depends(get_db_session),
):
    """Delete alumni profile (Admin only)."""
    alumni_service = AlumniService(session)
    await alumni_service.delete_alumni(alumni_id)
