"""Service for alumni operations."""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.repositories.base import BaseRepository
from app.repositories.user import UserRepository
from app.models.alumni import Alumni
from app.models.user import User, RoleEnum
from app.schemas.alumni import (
    AlumniCreateRequest,
    AlumniUpdateRequest,
    AlumniResponse,
    AlumniListResponse,
    PaginatedAlumniResponse,
)
from app.core.utils import get_utc_now


class AlumniRepository(BaseRepository[Alumni]):
    """Repository for Alumni operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, Alumni)

    async def get_by_user_id(self, user_id: int) -> Alumni | None:
        """Get alumni by user ID."""
        result = await self.session.execute(
            select(self.model).where(self.model.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def search(
        self,
        batch: str = None,
        department: str = None,
        profession: str = None,
        country: str = None,
        company: str = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Alumni], int]:
        """Search alumni with filters."""
        query = select(self.model)
        conditions = []

        if batch:
            conditions.append(self.model.batch == batch)
        if department:
            conditions.append(self.model.department == department)
        if profession:
            conditions.append(self.model.profession.ilike(f"%{profession}%"))
        if country:
            conditions.append(self.model.country == country)
        if company:
            conditions.append(self.model.company.ilike(f"%{company}%"))

        if conditions:
            query = query.where(and_(*conditions))

        # Count total
        count_query = select(func.count(self.model.id)).select_from(self.model)
        if conditions:
            count_query = count_query.where(and_(*conditions))
        total_result = await self.session.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results
        result = await self.session.execute(
            query.offset(skip).limit(limit)
        )
        return result.scalars().all(), total


class AlumniService:
    """Service for alumni operations."""

    def __init__(self, session: AsyncSession):
        self.alumni_repo = AlumniRepository(session)
        self.user_repo = UserRepository(session)
        self.session = session

    async def create_alumni(self, request: AlumniCreateRequest) -> dict:
        """Create new alumni profile."""
        existing_user = await self.user_repo.get_by_email(request.email)
        if existing_user:
            existing_alumni = await self.alumni_repo.get_by_user_id(existing_user.id)
            if existing_alumni:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Alumni with this email already exists",
                )
            user = existing_user
            user.full_name = request.name
            user.phone = request.phone
            if user.role != RoleEnum.ALUMNI:
                user.role = RoleEnum.ALUMNI
        else:
            user = User(
                email=request.email,
                full_name=request.name,
                phone=request.phone,
                role=RoleEnum.ALUMNI,
                is_active=False,
                is_verified=False,
                is_locked=False,
            )
            self.session.add(user)
            await self.session.flush()

        if await self.alumni_repo.get_by_user_id(user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Alumni with this email already exists",
            )

        alumni_data = request.model_dump()
        alumni_data["user_id"] = user.id
        alumni = await self.alumni_repo.create(alumni_data)
        await self.alumni_repo.commit()

        return {
            "message": "Alumni profile created",
            "alumni_id": alumni.id,
            "user_id": user.id,
        }

    async def get_alumni_by_id(self, alumni_id: int) -> AlumniResponse:
        """Get alumni by ID."""
        alumni = await self.alumni_repo.get_by_id(alumni_id)
        if not alumni:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alumni not found",
            )
        return alumni

    async def get_alumni_by_user_id(self, user_id: int) -> AlumniResponse:
        """Get alumni by user ID."""
        alumni = await self.alumni_repo.get_by_user_id(user_id)
        if not alumni:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alumni profile not found",
            )
        return alumni

    async def update_alumni_by_user_id(
        self,
        user_id: int,
        request: AlumniUpdateRequest,
    ) -> AlumniResponse:
        """Update alumni profile by user ID."""
        alumni = await self.alumni_repo.get_by_user_id(user_id)
        if not alumni:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alumni profile not found",
            )
        return await self.update_alumni(alumni.id, request)

    async def update_alumni(self, alumni_id: int, request: AlumniUpdateRequest) -> AlumniResponse:
        """Update alumni profile."""
        alumni = await self.alumni_repo.get_by_id(alumni_id)
        if not alumni:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alumni not found",
            )

        update_data = request.model_dump(exclude_unset=True)
        updated_alumni = await self.alumni_repo.update(alumni_id, update_data)
        updated_alumni.updated_at = get_utc_now()
        await self.alumni_repo.commit()

        return updated_alumni

    async def search_alumni(
        self,
        skip: int = 0,
        limit: int = 20,
        batch: str = None,
        department: str = None,
        profession: str = None,
        country: str = None,
        company: str = None,
    ) -> PaginatedAlumniResponse:
        """Search alumni with filters."""
        alumni_list, total = await self.alumni_repo.search(
            batch=batch,
            department=department,
            profession=profession,
            country=country,
            company=company,
            skip=skip,
            limit=limit,
        )

        items = [AlumniListResponse.model_validate(a) for a in alumni_list]

        return PaginatedAlumniResponse(
            items=items,
            total=total,
            skip=skip,
            limit=limit,
            page=(skip // limit) + 1 if limit > 0 else 1,
            pages=(total + limit - 1) // limit if limit > 0 else 0,
        )

    async def delete_alumni(self, alumni_id: int) -> None:
        """Delete alumni profile."""
        alumni = await self.alumni_repo.get_by_id(alumni_id)
        if not alumni:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alumni not found",
            )

        await self.alumni_repo.delete(alumni_id)
        await self.alumni_repo.commit()
