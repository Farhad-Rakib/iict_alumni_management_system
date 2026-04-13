"""Service layer for RBAC management operations."""
from collections.abc import Callable
from fastapi import HTTPException, status
from fastapi.routing import APIRoute
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rbac import ROLE_PERMISSIONS, get_permissions_for_role
from app.core.security import hash_password
from app.models.rbac import Role
from app.models.user import Permission, RoleEnum, User
from app.repositories.rbac import RBACRepository
from app.schemas.rbac import (
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


DEFAULT_PERMISSION_META: dict[str, tuple[str, str, str]] = {
    "dashboard.view": ("View dashboard", "dashboard", "view"),
    "reports.view": ("View reports", "reports", "view"),
    "activity.view": ("View activity logs", "activity", "view"),
    "settings.view": ("View settings", "settings", "view"),
    "rbac.manage": ("Manage RBAC", "rbac", "manage"),
    "rbac.permissions.view": ("View RBAC permissions", "rbac", "permissions_view"),
    "rbac.roles.view": ("View RBAC roles", "rbac", "roles_view"),
    "rbac.users.view": ("View RBAC users", "rbac", "users_view"),
    "rbac.role_permissions.view": ("View role-permission mappings", "rbac", "role_permissions_view"),
    "rbac.user_roles.view": ("View user-role mappings", "rbac", "user_roles_view"),
    "rbac.user_permissions.view": ("View user-permission mappings", "rbac", "user_permissions_view"),
    "users.view": ("View users", "users", "view"),
    "users.create": ("Create users", "users", "create"),
    "users.edit": ("Edit users", "users", "edit"),
    "users.delete": ("Delete users", "users", "delete"),
    "alumni.view": ("View alumni", "alumni", "view"),
    "alumni.create": ("Create alumni", "alumni", "create"),
    "alumni.edit": ("Edit alumni", "alumni", "edit"),
    "alumni.delete": ("Delete alumni", "alumni", "delete"),
    "alumni.profile.edit": ("Edit own alumni profile", "alumni", "profile_edit"),
    "events.view": ("View events", "events", "view"),
    "events.create": ("Create events", "events", "create"),
    "events.edit": ("Edit events", "events", "edit"),
    "events.delete": ("Delete events", "events", "delete"),
    "events.rsvp": ("RSVP events", "events", "rsvp"),
    "events.view_rsvps": ("View event RSVPs", "events", "view_rsvps"),
    "jobs.view": ("View jobs", "jobs", "view"),
    "jobs.create": ("Create jobs", "jobs", "create"),
    "jobs.edit": ("Edit jobs", "jobs", "edit"),
    "jobs.delete": ("Delete jobs", "jobs", "delete"),
    "jobs.apply": ("Apply to jobs", "jobs", "apply"),
    "jobs.view_applications": ("View job applications", "jobs", "view_applications"),
    "notices.view": ("View notices", "notices", "view"),
    "notices.manage_categories": ("Manage notice categories", "notices", "manage_categories"),
    "notices.create": ("Create notices", "notices", "create"),
    "notices.edit": ("Edit notices", "notices", "edit"),
    "notices.delete": ("Delete notices", "notices", "delete"),
    "elections.view": ("View elections", "elections", "view"),
    "elections.manage": ("Manage elections", "elections", "manage"),
    "elections.vote": ("Vote in elections", "elections", "vote"),
    "elections.results": ("View election results", "elections", "results"),
    "cms.view": ("View CMS", "cms", "view"),
    "cms.manage": ("Manage CMS", "cms", "manage"),
}


class RBACService:
    """Business logic for RBAC CRUD and assignments."""

    def __init__(self, session: AsyncSession):
        self.repo = RBACRepository(session)
        self.session = session

    async def ensure_defaults(self) -> None:
        for perm_name, meta in DEFAULT_PERMISSION_META.items():
            if await self.repo.get_permission_by_name(perm_name):
                continue
            description, resource, action = meta
            self.session.add(
                Permission(
                    name=perm_name,
                    description=description,
                    resource=resource,
                    action=action,
                )
            )

        await self.session.flush()

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

        await self.session.flush()

        all_permissions = await self.repo.list_permissions()
        perm_by_name = {p.name: p.id for p in all_permissions}

        for role_enum in RoleEnum:
            role = await self.repo.get_role_by_name(role_enum.value)
            if not role:
                continue
            static_permissions = get_permissions_for_role(role_enum)
            if "*" in static_permissions:
                target_ids = [p.id for p in all_permissions]
            else:
                target_ids = [perm_by_name[name] for name in static_permissions if name in perm_by_name]
            existing_mappings = await self.repo.get_role_permissions(role.id)
            if target_ids and not existing_mappings:
                await self.repo.replace_role_permissions(role.id, target_ids)

        await self.repo.commit()

    async def list_permissions(self) -> list[PermissionResponse]:
        await self.ensure_defaults()
        permissions = await self.repo.list_permissions()
        return [PermissionResponse.model_validate(p) for p in permissions]

    async def create_permission(self, request: PermissionCreateRequest) -> PermissionResponse:
        await self.ensure_defaults()
        existing = await self.repo.get_permission_by_name(request.name)
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Permission already exists")

        permission = Permission(
            name=request.name,
            description=request.description,
            resource=request.resource,
            action=request.action,
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
        if request.name:
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
        return [await self._build_user_response(user) for user in users]

    async def create_user(self, request: RBACUserCreateRequest) -> RBACUserResponse:
        await self.ensure_defaults()
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
        await self.repo.replace_user_roles(user_id, request.role_ids)
        await self.repo.commit()
        return await self.get_user_assignments(user_id)

    async def update_user_permissions(self, user_id: int, request: UserPermissionUpdateRequest) -> UserAssignmentsResponse:
        await self.ensure_defaults()
        user = await self.repo.get_user(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        await self.repo.replace_user_permissions(user_id, request.permission_ids)
        await self.repo.commit()
        return await self.get_user_assignments(user_id)

    async def get_user_assignments(self, user_id: int) -> UserAssignmentsResponse:
        await self.ensure_defaults()
        user = await self.repo.get_user(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        role_rows = await self.repo.get_user_roles(user_id)
        permission_rows = await self.repo.get_user_permissions(user_id)

        roles = await self.repo.list_roles()
        permissions = await self.repo.list_permissions()
        role_lookup = {role.id: role.name for role in roles}
        permission_lookup = {permission.id: permission.name for permission in permissions}

        role_ids = [row.role_id for row in role_rows]
        permission_ids = [row.permission_id for row in permission_rows]

        effective_permissions = set(get_permissions_for_role(user.role))

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
            direct_permissions=sorted([permission_lookup[pid] for pid in permission_ids if pid in permission_lookup]),
            effective_permissions=sorted(list(effective_permissions)),
        )

    async def get_effective_permissions(self, user: User) -> set[str]:
        """Compute effective permissions for a user from static + dynamic assignments."""
        await self.ensure_defaults()
        assignments = await self.get_user_assignments(user.id)
        return set(assignments.effective_permissions)

    async def sync_permissions_from_routes(self, app) -> PermissionSyncResponse:
        """Discover permissions declared in route dependencies and persist missing ones."""
        await self.ensure_defaults()

        discovered: set[str] = set()
        for route in app.routes:
            if not isinstance(route, APIRoute):
                continue

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

            for call in dependency_calls:
                perms = self._extract_permissions_from_dependency(call)
                discovered.update(perms)

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

        if created_permissions:
            await self.repo.commit()

        return PermissionSyncResponse(
            discovered_permissions=sorted_discovered,
            created_permissions=created_permissions,
            existing_permissions=existing_permissions,
            discovered_count=len(sorted_discovered),
            created_count=len(created_permissions),
            existing_count=len(existing_permissions),
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
