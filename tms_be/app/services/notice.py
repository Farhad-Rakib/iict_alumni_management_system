"""Service for notice operations."""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.repositories.base import BaseRepository
from app.models.notice import Notice, NoticeCategory, NoticeNotification
from app.schemas.notice import (
    NoticeCategoryRequest,
    NoticeCategoryResponse,
    NoticeCreateRequest,
    NoticeUpdateRequest,
    NoticeResponse,
    NoticeListResponse,
    PaginatedNoticeResponse,
)
from app.core.utils import get_utc_now


class NoticeCategoryRepository(BaseRepository[NoticeCategory]):
    """Repository for Notice Category operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, NoticeCategory)


class NoticeRepository(BaseRepository[Notice]):
    """Repository for Notice operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, Notice)

    async def get_published_notices(self, skip: int = 0, limit: int = 20) -> tuple[list[Notice], int]:
        """Get published notices."""
        query = select(self.model).where(self.model.is_published == True)
        count_result = await self.session.execute(
            select(func.count(self.model.id)).where(self.model.is_published == True)
        )
        total = count_result.scalar() or 0

        result = await self.session.execute(query.offset(skip).limit(limit))
        return result.scalars().all(), total


class NoticeService:
    """Service for notice operations."""

    def __init__(self, session: AsyncSession):
        self.category_repo = NoticeCategoryRepository(session)
        self.notice_repo = NoticeRepository(session)
        self.session = session

    async def create_category(self, request: NoticeCategoryRequest) -> NoticeCategoryResponse:
        """Create a notice category."""
        category = await self.category_repo.create(request.model_dump())
        await self.category_repo.commit()
        return category

    async def get_all_categories(self) -> list[NoticeCategoryResponse]:
        """Get all categories."""
        categories = await self.category_repo.get_all()
        return [NoticeCategoryResponse.model_validate(c) for c in categories]

    async def create_notice(self, request: NoticeCreateRequest, user_id: int) -> NoticeResponse:
        """Create a new notice."""
        notice_data = request.model_dump()
        notice_data["created_by"] = user_id

        notice = await self.notice_repo.create(notice_data)
        await self.notice_repo.commit()

        return notice

    async def get_notice_by_id(self, notice_id: int) -> NoticeResponse:
        """Get notice by ID."""
        notice = await self.notice_repo.get_by_id(notice_id)
        if not notice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notice not found",
            )

        # Increment view count
        notice.views = (notice.views or 0) + 1
        await self.notice_repo.commit()

        return notice

    async def update_notice(self, notice_id: int, request: NoticeUpdateRequest) -> NoticeResponse:
        """Update a notice."""
        notice = await self.notice_repo.get_by_id(notice_id)
        if not notice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notice not found",
            )

        update_data = request.model_dump(exclude_unset=True)
        updated_notice = await self.notice_repo.update(notice_id, update_data)
        await self.notice_repo.commit()

        return updated_notice

    async def list_notices(self, skip: int = 0, limit: int = 20) -> PaginatedNoticeResponse:
        """List published notices."""
        notices, total = await self.notice_repo.get_published_notices(skip=skip, limit=limit)

        items = [NoticeListResponse.model_validate(n) for n in notices]

        return PaginatedNoticeResponse(
            items=items,
            total=total,
            skip=skip,
            limit=limit,
            page=(skip // limit) + 1 if limit > 0 else 1,
            pages=(total + limit - 1) // limit if limit > 0 else 0,
        )

    async def delete_notice(self, notice_id: int) -> None:
        """Delete a notice."""
        notice = await self.notice_repo.get_by_id(notice_id)
        if not notice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notice not found",
            )

        await self.notice_repo.delete(notice_id)
        await self.notice_repo.commit()
