"""Service layer for site settings."""
from app.repositories.site_settings import SiteSettingsRepository
from app.schemas.site_settings import SiteSettingResponse, SiteSettingUpdateRequest


DEFAULT_SITE_SETTINGS: dict[str, dict] = {
    "general": {
        "siteName": "BUET Alumni Portal",
        "siteDescription": "Alumni management and engagement platform",
        "supportEmail": "support@alumni.buet.ac.bd",
        "timezone": "UTC",
        "dateFormat": "MM/DD/YYYY",
        "language": "en",
        "maintenanceMode": False,
    },
    "preferences": {
        "tableDensity": "normal",
        "sidebarCollapsed": False,
        "formPresentation": "modal",
        "menuStyle": "fixed",
        "colorScheme": "buet",
    },
    "security": {
        "twoFactorAuth": False,
        "sessionTimeout": "60",
        "maxLoginAttempts": "5",
        "passwordMinLength": "8",
        "requireSpecialChars": True,
        "requireUppercase": True,
        "ipWhitelist": "",
        "auditLogRetention": "90",
    },
    "notifications": {
        "emailNotifications": True,
        "pushNotifications": True,
        "newUserAlert": True,
        "securityAlert": True,
        "systemUpdateAlert": False,
        "weeklyReport": True,
        "monthlyReport": False,
    },
}


class SiteSettingsService:
    """Business logic for site settings operations."""

    def __init__(self, session):
        self.repo = SiteSettingsRepository(session)

    async def get_setting(self, setting_key: str) -> SiteSettingResponse:
        setting = await self.repo.get_by_key(setting_key)
        if setting:
            return SiteSettingResponse.model_validate(setting)

        default_value = DEFAULT_SITE_SETTINGS.get(setting_key, {})
        setting = await self.repo.upsert(
            setting_key=setting_key,
            setting_value=default_value,
            description=f"Auto-created default for {setting_key}",
            updated_by=None,
        )
        await self.repo.commit()
        return SiteSettingResponse.model_validate(setting)

    async def upsert_setting(
        self,
        setting_key: str,
        request: SiteSettingUpdateRequest,
        updated_by: int | None,
    ) -> SiteSettingResponse:
        setting = await self.repo.upsert(
            setting_key=setting_key,
            setting_value=request.setting_value,
            description=request.description,
            updated_by=updated_by,
        )
        await self.repo.commit()
        return SiteSettingResponse.model_validate(setting)
