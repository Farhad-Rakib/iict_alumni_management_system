"""Base repository for common CRUD operations."""
from typing import TypeVar, Generic, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

T = TypeVar("T")


class BaseRepository(Generic[T]):
    """Base repository with common CRUD operations."""

    def __init__(self, session: AsyncSession, model: type[T]):
        self.session = session
        self.model = model

    async def create(self, obj: dict | T) -> T:
        """Create a new record."""
        if isinstance(obj, dict):
            db_obj = self.model(**obj)
        else:
            db_obj = obj
        self.session.add(db_obj)
        await self.session.flush()
        return db_obj

    async def get_by_id(self, obj_id: int) -> T | None:
        """Get record by ID."""
        result = await self.session.execute(
            select(self.model).where(self.model.id == obj_id)
        )
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """Get all records with pagination."""
        result = await self.session.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def count(self) -> int:
        """Count total records."""
        result = await self.session.execute(select(func.count(self.model.id)))
        return result.scalar()

    async def update(self, obj_id: int, obj: dict) -> T | None:
        """Update a record."""
        db_obj = await self.get_by_id(obj_id)
        if db_obj:
            for key, value in obj.items():
                if value is not None:
                    setattr(db_obj, key, value)
            await self.session.flush()
        return db_obj

    async def delete(self, obj_id: int) -> bool:
        """Delete a record."""
        db_obj = await self.get_by_id(obj_id)
        if db_obj:
            await self.session.delete(db_obj)
            await self.session.flush()
            return True
        return False

    async def commit(self) -> None:
        """Commit the transaction."""
        await self.session.commit()

    async def rollback(self) -> None:
        """Rollback the transaction."""
        await self.session.rollback()
