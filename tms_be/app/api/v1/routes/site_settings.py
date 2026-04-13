"""Site settings API routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db_session
from app.dependencies.auth import get_current_user, require_permission
from app.models.user import User
from app.schemas.site_settings import SiteSettingResponse, SiteSettingUpdateRequest
from app.services.site_settings import SiteSettingsService

router = APIRouter(prefix="/api/v1/site-settings", tags=["Site Settings"])


@router.get("/{setting_key}", response_model=SiteSettingResponse, dependencies=[Depends(require_permission("settings.view"))])
async def get_setting(
    setting_key: str,
    session: AsyncSession = Depends(get_db_session),
):
    service = SiteSettingsService(session)
    return await service.get_setting(setting_key)


@router.put("/{setting_key}", response_model=SiteSettingResponse, dependencies=[Depends(require_permission("settings.view"))])
async def upsert_setting(
    setting_key: str,
    request: SiteSettingUpdateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    service = SiteSettingsService(session)
    return await service.upsert_setting(setting_key, request, current_user.id)
