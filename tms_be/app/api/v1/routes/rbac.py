"""RBAC management API routes."""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db_session
from app.dependencies.auth import require_permission
from app.schemas.rbac import (
    EndpointPermissionResponse,
    PermissionCreateRequest,
    PermissionResponse,
    RBACUserCreateRequest,
    RBACUserResponse,
    RoleCreateRequest,
    RolePermissionUpdateRequest,
    RoleResponse,
    RoleUpdateRequest,
    UserAssignmentsResponse,
    UserPermissionUpdateRequest,
    UserRoleUpdateRequest,
    PermissionSyncResponse,
)
from app.services.rbac import RBACService

router = APIRouter(prefix="/api/v1/rbac", tags=["RBAC"])


@router.get(
    "/permissions",
    response_model=list[PermissionResponse],
    dependencies=[Depends(require_permission("rbac.manage", "rbac.permissions.view", "rbac.role_permissions.view", "rbac.user_permissions.view"))],
)
async def list_permissions(session: AsyncSession = Depends(get_db_session)):
    service = RBACService(session)
    return await service.list_permissions()


@router.get(
    "/permissions/endpoints",
    response_model=list[EndpointPermissionResponse],
    dependencies=[Depends(require_permission("rbac.manage", "rbac.permissions.read", "rbac.permissions.view"))],
)
async def list_endpoint_permissions(session: AsyncSession = Depends(get_db_session)):
    service = RBACService(session)
    return await service.list_endpoint_permissions()


@router.post("/permissions", response_model=PermissionResponse, dependencies=[Depends(require_permission("rbac.manage"))])
async def create_permission(
    request: PermissionCreateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    service = RBACService(session)
    return await service.create_permission(request)


@router.post(
    "/permissions/sync",
    response_model=PermissionSyncResponse,
    dependencies=[Depends(require_permission("rbac.manage"))],
)
async def sync_permissions(
    request: Request,
    session: AsyncSession = Depends(get_db_session),
):
    service = RBACService(session)
    return await service.sync_permissions_from_routes(request.app)


@router.get(
    "/roles",
    response_model=list[RoleResponse],
    dependencies=[Depends(require_permission("rbac.manage", "rbac.roles.view", "rbac.role_permissions.view", "rbac.user_roles.view"))],
)
async def list_roles(session: AsyncSession = Depends(get_db_session)):
    service = RBACService(session)
    return await service.list_roles()


@router.post("/roles", response_model=RoleResponse, dependencies=[Depends(require_permission("rbac.manage"))])
async def create_role(
    request: RoleCreateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    service = RBACService(session)
    return await service.create_role(request)


@router.put("/roles/{role_id}", response_model=RoleResponse, dependencies=[Depends(require_permission("rbac.manage"))])
async def update_role(
    role_id: int,
    request: RoleUpdateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    service = RBACService(session)
    return await service.update_role(role_id, request)


@router.put("/roles/{role_id}/permissions", response_model=RoleResponse, dependencies=[Depends(require_permission("rbac.manage"))])
async def update_role_permissions(
    role_id: int,
    request: RolePermissionUpdateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    service = RBACService(session)
    return await service.update_role_permissions(role_id, request)


@router.get(
    "/users",
    response_model=list[RBACUserResponse],
    dependencies=[Depends(require_permission("rbac.manage", "rbac.users.view", "rbac.user_roles.view", "rbac.user_permissions.view"))],
)
async def list_rbac_users(session: AsyncSession = Depends(get_db_session)):
    service = RBACService(session)
    return await service.list_users()


@router.post("/users", response_model=RBACUserResponse, dependencies=[Depends(require_permission("rbac.manage"))])
async def create_rbac_user(
    request: RBACUserCreateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    service = RBACService(session)
    return await service.create_user(request)


@router.get(
    "/users/{user_id}/assignments",
    response_model=UserAssignmentsResponse,
    dependencies=[Depends(require_permission("rbac.manage", "rbac.user_roles.view", "rbac.user_permissions.view"))],
)
async def get_user_assignments(
    user_id: int,
    session: AsyncSession = Depends(get_db_session),
):
    service = RBACService(session)
    return await service.get_user_assignments(user_id)


@router.put("/users/{user_id}/roles", response_model=UserAssignmentsResponse, dependencies=[Depends(require_permission("rbac.manage"))])
async def update_user_roles(
    user_id: int,
    request: UserRoleUpdateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    service = RBACService(session)
    return await service.update_user_roles(user_id, request)


@router.put("/users/{user_id}/permissions", response_model=UserAssignmentsResponse, dependencies=[Depends(require_permission("rbac.manage"))])
async def update_user_permissions(
    user_id: int,
    request: UserPermissionUpdateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    service = RBACService(session)
    return await service.update_user_permissions(user_id, request)
