"""Repository helpers for dynamic menu items."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.menu import MenuItem


class MenuRepository:
    """Data access for menu item records."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_active(self) -> list[MenuItem]:
        result = await self.session.execute(
            select(MenuItem)
            .where(MenuItem.is_active.is_(True))
            .order_by(MenuItem.sort_order.asc(), MenuItem.id.asc())
        )
        return result.scalars().all()

    async def list_key_map(self) -> dict[str, int]:
        result = await self.session.execute(select(MenuItem.id, MenuItem.key))
        return {row.key: row.id for row in result.all()}

    async def count_all(self) -> int:
        result = await self.session.execute(select(MenuItem.id))
        return len(result.scalars().all())

    async def commit(self) -> None:
        await self.session.commit()
