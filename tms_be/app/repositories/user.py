"""Repository for User model."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, User)

    async def get_by_email(self, email: str) -> User | None:
        """Get user by email."""
        result = await self.session.execute(
            select(self.model).where(self.model.email == email)
        )
        return result.scalar_one_or_none()

    async def get_active_by_email(self, email: str) -> User | None:
        """Get active user by email."""
        result = await self.session.execute(
            select(self.model).where(
                (self.model.email == email) & (self.model.is_active == True)
            )
        )
        return result.scalar_one_or_none()

    async def get_verified_by_email(self, email: str) -> User | None:
        """Get verified user by email."""
        result = await self.session.execute(
            select(self.model).where(
                (self.model.email == email) & (self.model.is_verified == True)
            )
        )
        return result.scalar_one_or_none()

    async def get_by_verification_token(self, token: str) -> User | None:
        """Get user by verification token."""
        result = await self.session.execute(
            select(self.model).where(self.model.verification_token == token)
        )
        return result.scalar_one_or_none()
