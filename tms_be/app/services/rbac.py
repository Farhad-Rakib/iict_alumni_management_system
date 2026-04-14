"""Service layer for RBAC management operations."""
from datetime import datetime
from collections.abc import Callable
from fastapi import HTTPException, status
from fastapi.routing import APIRoute
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rbac import normalize_permission_name
from app.core.security import hash_password
from app.models.rbac import EndpointPermission, Role
from app.models.user import Permission, RoleEnum, User
from app.repositories.rbac import RBACRepository
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
class RBACService:
    """Business logic for RBAC CRUD and assignments."""

    def __init__(self, session: AsyncSession):
        self.repo = RBACRepository(session)
        self.session = session

    def _canonical_permission_names(self, permission_names: list[str] | set[str]) -> list[str]:
        canonical = {normalize_permission_name(name) for name in permission_names if name}
        return sorted(canonical)

    def _is_protected_superadmin_user(self, user: User) -> bool:
        return user.role == RoleEnum.SUPER_ADMIN

    def _is_protected_superadmin_role(self, role: Role) -> bool:
        return role.name == RoleEnum.SUPER_ADMIN.value

    def _ensure_user_not_protected(self, user: User) -> None:
        if self._is_protected_superadmin_user(user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Super admin user is immutable",
            )

    def _ensure_role_not_protected(self, role: Role) -> None:
        if self._is_protected_superadmin_role(role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Super admin role is immutable",
            )

    async def ensure_defaults(self) -> None:
        for role_enum in RoleEnum:
            existing = await self.repo.get_role_by_name(role_enum.value)
            if existing:
                continue
            self.session.add(
                Role(
                    name=role_enum.value,
                    description=f"System role mapped from {role_enum.value}",
                    is_system=True,
                )
            )

        await self.repo.commit()

    async def list_permissions(self) -> list[PermissionResponse]:
        await self.ensure_defaults()
        permissions = await self.repo.list_permissions()
        endpoint_rows = await self.repo.list_endpoint_permissions()
        endpoint_count_by_name: dict[str, int] = {}
        for row in endpoint_rows:
            endpoint_count_by_name[row.permission_name] = endpoint_count_by_name.get(row.permission_name, 0) + 1

        response: list[PermissionResponse] = []
        for permission in permissions:
            data = PermissionResponse.model_validate(permission)
            data.endpoint_count = endpoint_count_by_name.get(permission.name, 0)
            response.append(data)
        return response

    async def list_endpoint_permissions(self) -> list[EndpointPermissionResponse]:
        await self.ensure_defaults()
        rows = await self.repo.list_endpoint_permissions()
        return [EndpointPermissionResponse.model_validate(row) for row in rows]

    async def create_permission(self, request: PermissionCreateRequest) -> PermissionResponse:
        await self.ensure_defaults()
        canonical_name = normalize_permission_name(request.name)
        existing = await self.repo.get_permission_by_name(canonical_name)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Permission already exists")

        permission = Permission(
            name=canonical_name,
            description=request.description,
            resource=request.resource,
            action=normalize_permission_name(f"x.{request.action}").split(".", 1)[1],
        )
        self.session.add(permission)
        await self.repo.commit()
        return PermissionResponse.model_validate(permission)

    async def list_roles(self) -> list[RoleResponse]:
        await self.ensure_defaults()
        roles = await self.repo.list_roles()
        all_permissions = await self.repo.list_permissions()
        permission_lookup = {p.id: p.name for p in all_permissions}

        response: list[RoleResponse] = []
        for role in roles:
            rp = await self.repo.get_role_permissions(role.id)
            permission_ids = [row.permission_id for row in rp]
            permissions = [permission_lookup[p_id] for p_id in permission_ids if p_id in permission_lookup]
            response.append(
                RoleResponse(
                    id=role.id,
                    name=role.name,
                    description=role.description,
                    is_system=role.is_system,
                    permissions=sorted(permissions),
                    permission_ids=sorted(permission_ids),
                    created_at=role.created_at,
                )
            )
        return response

    async def create_role(self, request: RoleCreateRequest) -> RoleResponse:
        await self.ensure_defaults()
        if request.name == RoleEnum.SUPER_ADMIN.value:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin role is reserved")
        existing = await self.repo.get_role_by_name(request.name)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role already exists")

        role = Role(name=request.name, description=request.description, is_system=False)
        self.session.add(role)
        await self.session.flush()
        if request.permission_ids:
            await self.repo.replace_role_permissions(role.id, request.permission_ids)
        await self.repo.commit()

        roles = await self.list_roles()
        for r in roles:
            if r.id == role.id:
                return r
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    async def update_role(self, role_id: int, request: RoleUpdateRequest) -> RoleResponse:
        await self.ensure_defaults()
        role = await self.repo.get_role(role_id)
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
        self._ensure_role_not_protected(role)
        if request.name:
            if request.name == RoleEnum.SUPER_ADMIN.value:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin role is reserved")
            role.name = request.name
        if request.description is not None:
            role.description = request.description
        await self.repo.commit()
        roles = await self.list_roles()
        for r in roles:
            if r.id == role_id:
                return r
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    async def update_role_permissions(self, role_id: int, request: RolePermissionUpdateRequest) -> RoleResponse:
        await self.ensure_defaults()
        role = await self.repo.get_role(role_id)
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
        self._ensure_role_not_protected(role)
        await self.repo.replace_role_permissions(role_id, request.permission_ids)
        await self.repo.commit()
        roles = await self.list_roles()
        for r in roles:
            if r.id == role_id:
                return r
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    async def list_users(self) -> list[RBACUserResponse]:
        await self.ensure_defaults()
        users = await self.repo.list_users()
        visible_users = [user for user in users if not self._is_protected_superadmin_user(user)]
        return [await self._build_user_response(user) for user in visible_users]

    async def create_user(self, request: RBACUserCreateRequest) -> RBACUserResponse:
        await self.ensure_defaults()
        if request.base_role == RoleEnum.SUPER_ADMIN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Creating super admin via RBAC API is not allowed")
        existing = await self.repo.get_user_by_email(request.email)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")

        user = User(
            email=request.email,
            full_name=request.full_name,
            password_hash=hash_password(request.password),
            role=request.base_role,
            is_active=True,
            is_verified=True,
        )
        self.session.add(user)
        await self.session.flush()

        await self.repo.replace_user_roles(user.id, request.role_ids)
        await self.repo.replace_user_permissions(user.id, request.permission_ids)
        await self.repo.commit()

        return await self._build_user_response(user)

    async def update_user_roles(self, user_id: int, request: UserRoleUpdateRequest) -> UserAssignmentsResponse:
        await self.ensure_defaults()
        user = await self.repo.get_user(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        self._ensure_user_not_protected(user)

        super_role = await self.repo.get_role_by_name(RoleEnum.SUPER_ADMIN.value)
        if super_role and super_role.id in request.role_ids:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Assigning super admin role via RBAC API is not allowed")

        await self.repo.replace_user_roles(user_id, request.role_ids)
        await self.repo.commit()
        return await self.get_user_assignments(user_id)

    async def update_user_permissions(self, user_id: int, request: UserPermissionUpdateRequest) -> UserAssignmentsResponse:
        await self.ensure_defaults()
        user = await self.repo.get_user(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        self._ensure_user_not_protected(user)
        await self.repo.replace_user_permissions(user_id, request.permission_ids)
        await self.repo.commit()
        return await self.get_user_assignments(user_id)

    async def get_user_assignments(self, user_id: int) -> UserAssignmentsResponse:
        await self.ensure_defaults()
        user = await self.repo.get_user(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        if self._is_protected_superadmin_user(user):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin user is hidden from RBAC assignment views")

        role_rows = await self.repo.get_user_roles(user_id)
        permission_rows = await self.repo.get_user_permissions(user_id)

        roles = await self.repo.list_roles()
        permissions = await self.repo.list_permissions()
        role_lookup = {role.id: role.name for role in roles}
        permission_lookup = {permission.id: permission.name for permission in permissions}

        role_ids = [row.role_id for row in role_rows]
        permission_ids = [row.permission_id for row in permission_rows]

        effective_permissions: set[str] = set()

        if user.role == RoleEnum.SUPER_ADMIN:
            effective_permissions.add("*")

        for role_id in role_ids:
            role_perm_rows = await self.repo.get_role_permissions(role_id)
            for rp in role_perm_rows:
                name = permission_lookup.get(rp.permission_id)
                if name:
                    effective_permissions.add(name)

        for permission_id in permission_ids:
            name = permission_lookup.get(permission_id)
            if name:
                effective_permissions.add(name)

        return UserAssignmentsResponse(
            user_id=user_id,
            role_ids=sorted(role_ids),
            permission_ids=sorted(permission_ids),
            roles=sorted([role_lookup[rid] for rid in role_ids if rid in role_lookup]),
            direct_permissions=self._canonical_permission_names(
                [permission_lookup[pid] for pid in permission_ids if pid in permission_lookup]
            ),
            effective_permissions=self._canonical_permission_names(effective_permissions),
        )

    async def get_effective_permissions(self, user: User) -> set[str]:
        """Compute effective permissions for a user from static + dynamic assignments."""
        await self.ensure_defaults()
        if user.role == RoleEnum.SUPER_ADMIN:
            all_permissions = await self.repo.list_permissions()
            return {"*", *[p.name for p in all_permissions]}
        assignments = await self.get_user_assignments(user.id)
        return set(self._canonical_permission_names(assignments.effective_permissions))

    async def sync_permissions_from_routes(self, app) -> PermissionSyncResponse:
        """Discover endpoint permissions and persist CRUD + declared custom permissions."""
        await self.ensure_defaults()

        discovered: set[str] = set()
        active_endpoint_keys: set[tuple[str, str]] = set()
        endpoint_count = 0

        for route in app.routes:
            if not isinstance(route, APIRoute):
                continue

            resource = self._infer_resource_from_path(route.path)
            if not resource:
                continue

            declared_permissions = set(self._extract_declared_permissions(route))
            discovered.update(declared_permissions)

            for method in sorted(route.methods or []):
                if method in {"HEAD", "OPTIONS"}:
                    continue
                action = self._action_from_method(method)
                if not action:
                    continue

                crud_permission_name = f"{resource}.{action}"
                discovered.add(crud_permission_name)

                endpoint_permission_name = next(iter(declared_permissions), crud_permission_name)
                endpoint_source = "declared" if endpoint_permission_name in declared_permissions else "auto"

                active_endpoint_keys.add((route.path, method))
                endpoint_count += 1

                row = await self.repo.get_endpoint_permission(route.path, method)
                if row:
                    row.route_name = route.name
                    row.resource = resource
                    row.action = action
                    row.permission_name = endpoint_permission_name
                    row.source = endpoint_source
                    row.is_active = True
                    row.last_synced_at = datetime.utcnow()
                else:
                    self.session.add(
                        EndpointPermission(
                            route_path=route.path,
                            http_method=method,
                            route_name=route.name,
                            resource=resource,
                            action=action,
                            permission_name=endpoint_permission_name,
                            source=endpoint_source,
                            is_active=True,
                            last_synced_at=datetime.utcnow(),
                        )
                    )

        discovered = {p for p in discovered if p and p != "*"}
        sorted_discovered = sorted(discovered)

        created_permissions: list[str] = []
        existing_permissions: list[str] = []

        for permission_name in sorted_discovered:
            existing = await self.repo.get_permission_by_name(permission_name)
            if existing:
                existing_permissions.append(permission_name)
                continue

            description, resource, action = self._meta_from_permission_name(permission_name)
            self.session.add(
                Permission(
                    name=permission_name,
                    description=description,
                    resource=resource,
                    action=action,
                )
            )
            created_permissions.append(permission_name)

        await self.session.flush()

        permission_by_name = {p.name: p.id for p in await self.repo.list_permissions()}
        endpoint_rows = await self.repo.list_endpoint_permissions()
        for row in endpoint_rows:
            row.permission_id = permission_by_name.get(row.permission_name)

        await self.repo.deactivate_missing_endpoint_permissions(active_endpoint_keys)
        await self.repo.commit()

        return PermissionSyncResponse(
            discovered_permissions=sorted_discovered,
            created_permissions=created_permissions,
            existing_permissions=existing_permissions,
            discovered_count=len(sorted_discovered),
            created_count=len(created_permissions),
            existing_count=len(existing_permissions),
            endpoint_count=endpoint_count,
        )

    def _extract_permissions_from_dependency(self, call: Callable) -> tuple[str, ...]:
        metadata_permissions = getattr(call, "required_permissions", None)
        if isinstance(metadata_permissions, tuple):
            return metadata_permissions

        closure = getattr(call, "__closure__", None)
        freevars = getattr(getattr(call, "__code__", None), "co_freevars", ())
        if not closure or not freevars:
            return tuple()

        if "permissions" in freevars:
            idx = freevars.index("permissions")
            value = closure[idx].cell_contents
            if isinstance(value, tuple):
                return value
        return tuple()

    def _extract_declared_permissions(self, route: APIRoute) -> tuple[str, ...]:
        dependency_calls: list[Callable] = []

        for dep in route.dependencies or []:
            call = getattr(dep, "dependency", None)
            if callable(call):
                dependency_calls.append(call)

        route_dependant = getattr(route, "dependant", None)
        if route_dependant:
            for dep in getattr(route_dependant, "dependencies", []) or []:
                call = getattr(dep, "call", None)
                if callable(call):
                    dependency_calls.append(call)

        discovered: set[str] = set()
        for call in dependency_calls:
            perms = self._extract_permissions_from_dependency(call)
            discovered.update(normalize_permission_name(p) for p in perms)
        return tuple(sorted(discovered))

    def _infer_resource_from_path(self, route_path: str) -> str | None:
        parts = [p for p in route_path.split("/") if p]
        if not parts:
            return None
        if parts[:2] == ["api", "v1"] and len(parts) >= 3:
            return parts[2]
        return parts[0]

    def _action_from_method(self, method: str) -> str | None:
        mapping = {
            "POST": "create",
            "GET": "read",
            "PUT": "update",
            "PATCH": "update",
            "DELETE": "delete",
        }
        return mapping.get(method)

    def _meta_from_permission_name(self, permission_name: str) -> tuple[str, str, str]:
        parts = permission_name.split(".")
        if len(parts) >= 2:
            resource = parts[0]
            action = "_".join(parts[1:])
        else:
            resource = "system"
            action = permission_name.replace(".", "_")
        description = f"Auto-synced permission: {permission_name}"
        return description, resource, action

    async def _build_user_response(self, user: User) -> RBACUserResponse:
        assignments = await self.get_user_assignments(user.id)
        return RBACUserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            base_role=user.role,
            is_active=user.is_active,
            is_verified=user.is_verified,
            roles=assignments.roles,
            role_ids=assignments.role_ids,
            direct_permissions=assignments.direct_permissions,
            direct_permission_ids=assignments.permission_ids,
        )
