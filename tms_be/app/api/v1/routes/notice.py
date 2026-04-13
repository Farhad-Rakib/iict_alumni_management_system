"""Notices API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import get_db_session
from app.dependencies.auth import get_current_user, require_permission
from app.models.user import User
from app.schemas.notice import (
    NoticeCategoryRequest,
    NoticeCategoryResponse,
    NoticeCreateRequest,
    NoticeUpdateRequest,
    NoticeResponse,
    NoticeListResponse,
    PaginatedNoticeResponse,
)
from app.services.notice import NoticeService

router = APIRouter(prefix="/api/v1/notices", tags=["Notices"])


@router.get("/categories", response_model=list[NoticeCategoryResponse])
async def get_categories(
    session: AsyncSession = Depends(get_db_session),
):
    """Get all notice categories."""
    notice_service = NoticeService(session)
    return await notice_service.get_all_categories()


@router.post("/categories", response_model=NoticeCategoryResponse, dependencies=[Depends(require_permission("notices.manage_categories"))])
async def create_category(
    request: NoticeCategoryRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Create a notice category."""
    notice_service = NoticeService(session)
    return await notice_service.create_category(request)


@router.post("/", response_model=NoticeResponse)
async def create_notice(
    request: NoticeCreateRequest,
    current_user: User = Depends(require_permission("notices.create")),
    session: AsyncSession = Depends(get_db_session),
):
    """Create a new notice."""
    notice_service = NoticeService(session)
    return await notice_service.create_notice(request, current_user.id)


@router.get("/", response_model=PaginatedNoticeResponse)
async def list_notices(
    skip: int = 0,
    limit: int = 20,
    session: AsyncSession = Depends(get_db_session),
):
    """List all published notices."""
    notice_service = NoticeService(session)
    return await notice_service.list_notices(skip=skip, limit=limit)


@router.get("/{notice_id}", response_model=NoticeResponse)
async def get_notice(
    notice_id: int,
    session: AsyncSession = Depends(get_db_session),
):
    """Get notice by ID."""
    notice_service = NoticeService(session)
    return await notice_service.get_notice_by_id(notice_id)


@router.put("/{notice_id}", response_model=NoticeResponse)
async def update_notice(
    notice_id: int,
    request: NoticeUpdateRequest,
    current_user: User = Depends(require_permission("notices.edit")),
    session: AsyncSession = Depends(get_db_session),
):
    """Update a notice."""
    notice_service = NoticeService(session)
    return await notice_service.update_notice(notice_id, request)


@router.delete("/{notice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notice(
    notice_id: int,
    current_user: User = Depends(require_permission("notices.delete")),
    session: AsyncSession = Depends(get_db_session),
):
    """Delete a notice."""
    notice_service = NoticeService(session)
    await notice_service.delete_notice(notice_id)
