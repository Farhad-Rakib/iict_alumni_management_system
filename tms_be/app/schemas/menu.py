"""Schemas for dynamic menu responses."""
from pydantic import BaseModel


class MenuItemResponse(BaseModel):
    id: str
    label: str
    path: str | None = None
    icon: str | None = None
    children: list["MenuItemResponse"] | None = None
    permissions: list[str] | None = None
    badge: str | None = None
    badgeVariant: str | None = None


MenuItemResponse.model_rebuild()
