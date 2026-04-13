"""Repository for site settings."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.site_settings import SiteSetting


class SiteSettingsRepository:
    """Data access helpers for site settings."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_key(self, setting_key: str) -> SiteSetting | None:
        result = await self.session.execute(
            select(SiteSetting).where(SiteSetting.setting_key == setting_key)
        )
        return result.scalar_one_or_none()

    async def upsert(
        self,
        setting_key: str,
        setting_value: dict,
        description: str | None,
        updated_by: int | None,
    ) -> SiteSetting:
        setting = await self.get_by_key(setting_key)
        if setting:
            setting.setting_value = setting_value
            setting.description = description
            setting.updated_by = updated_by
        else:
            setting = SiteSetting(
                setting_key=setting_key,
                setting_value=setting_value,
                description=description,
                updated_by=updated_by,
            )
            self.session.add(setting)
        await self.session.flush()
        return setting

    async def commit(self) -> None:
        await self.session.commit()
