"""Pydantic schemas for RBAC endpoints."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.user import RoleEnum


class PermissionCreateRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    resource: str = Field(..., min_length=2, max_length=100)
    action: str = Field(..., min_length=2, max_length=50)


class PermissionResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    resource: str
    action: str

    class Config:
        from_attributes = True


class RoleCreateRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None
    permission_ids: list[int] = []


class RoleUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = None


class RolePermissionUpdateRequest(BaseModel):
    permission_ids: list[int] = []


class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_system: bool
    permissions: list[str] = []
    permission_ids: list[int] = []
    created_at: datetime


class RBACUserCreateRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=8)
    base_role: RoleEnum = RoleEnum.ALUMNI
    role_ids: list[int] = []
    permission_ids: list[int] = []


class RBACUserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    base_role: RoleEnum
    is_active: bool
    is_verified: bool
    roles: list[str] = []
    role_ids: list[int] = []
    direct_permissions: list[str] = []
    direct_permission_ids: list[int] = []


class UserRoleUpdateRequest(BaseModel):
    role_ids: list[int] = []


class UserPermissionUpdateRequest(BaseModel):
    permission_ids: list[int] = []


class UserAssignmentsResponse(BaseModel):
    user_id: int
    role_ids: list[int] = []
    permission_ids: list[int] = []
    roles: list[str] = []
    direct_permissions: list[str] = []
    effective_permissions: list[str] = []


class PermissionSyncResponse(BaseModel):
    discovered_permissions: list[str] = []
    created_permissions: list[str] = []
    existing_permissions: list[str] = []
    discovered_count: int = 0
    created_count: int = 0
    existing_count: int = 0
