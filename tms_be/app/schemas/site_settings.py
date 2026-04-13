"""Pydantic schemas for site settings."""
from datetime import datetime

from pydantic import BaseModel, Field


class SiteSettingUpdateRequest(BaseModel):
    setting_value: dict = Field(default_factory=dict)
    description: str | None = None


class SiteSettingResponse(BaseModel):
    setting_key: str
    setting_value: dict
    description: str | None = None
    updated_by: int | None = None
    updated_at: datetime

    class Config:
        from_attributes = True
