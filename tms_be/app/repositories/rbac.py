"""Repository utilities for RBAC entities and assignments."""
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rbac import EndpointPermission, Role, RolePermission, UserPermission, UserRole
from app.models.user import Permission, User


class RBACRepository:
    """Data access for RBAC tables and computed permissions."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_roles(self) -> list[Role]:
        result = await self.session.execute(select(Role).order_by(Role.name.asc()))
        return result.scalars().all()

    async def get_role(self, role_id: int) -> Role | None:
        result = await self.session.execute(select(Role).where(Role.id == role_id))
        return result.scalar_one_or_none()

    async def get_role_by_name(self, name: str) -> Role | None:
        result = await self.session.execute(select(Role).where(Role.name == name))
        return result.scalar_one_or_none()

    async def list_permissions(self) -> list[Permission]:
        result = await self.session.execute(select(Permission).order_by(Permission.name.asc()))
        return result.scalars().all()

    async def list_endpoint_permissions(self) -> list[EndpointPermission]:
        result = await self.session.execute(
            select(EndpointPermission).order_by(EndpointPermission.resource.asc(), EndpointPermission.http_method.asc(), EndpointPermission.route_path.asc())
        )
        return result.scalars().all()

    async def get_endpoint_permission(self, route_path: str, http_method: str) -> EndpointPermission | None:
        result = await self.session.execute(
            select(EndpointPermission).where(
                (EndpointPermission.route_path == route_path)
                & (EndpointPermission.http_method == http_method)
            )
        )
        return result.scalar_one_or_none()

    async def get_permission(self, permission_id: int) -> Permission | None:
        result = await self.session.execute(select(Permission).where(Permission.id == permission_id))
        return result.scalar_one_or_none()

    async def get_permission_by_name(self, name: str) -> Permission | None:
        result = await self.session.execute(select(Permission).where(Permission.name == name))
        return result.scalar_one_or_none()

    async def list_users(self) -> list[User]:
        result = await self.session.execute(select(User).order_by(User.id.asc()))
        return result.scalars().all()

    async def get_user(self, user_id: int) -> User | None:
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_user_by_email(self, email: str) -> User | None:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_role_permissions(self, role_id: int) -> list[RolePermission]:
        result = await self.session.execute(select(RolePermission).where(RolePermission.role_id == role_id))
        return result.scalars().all()

    async def get_user_roles(self, user_id: int) -> list[UserRole]:
        result = await self.session.execute(select(UserRole).where(UserRole.user_id == user_id))
        return result.scalars().all()

    async def get_user_permissions(self, user_id: int) -> list[UserPermission]:
        result = await self.session.execute(select(UserPermission).where(UserPermission.user_id == user_id))
        return result.scalars().all()

    async def replace_role_permissions(self, role_id: int, permission_ids: list[int]) -> None:
        await self.session.execute(delete(RolePermission).where(RolePermission.role_id == role_id))
        for permission_id in permission_ids:
            self.session.add(RolePermission(role_id=role_id, permission_id=permission_id))

    async def replace_user_roles(self, user_id: int, role_ids: list[int]) -> None:
        await self.session.execute(delete(UserRole).where(UserRole.user_id == user_id))
        for role_id in role_ids:
            self.session.add(UserRole(user_id=user_id, role_id=role_id))

    async def replace_user_permissions(self, user_id: int, permission_ids: list[int]) -> None:
        await self.session.execute(delete(UserPermission).where(UserPermission.user_id == user_id))
        for permission_id in permission_ids:
            self.session.add(UserPermission(user_id=user_id, permission_id=permission_id))

    async def deactivate_missing_endpoint_permissions(self, active_keys: set[tuple[str, str]]) -> None:
        rows = await self.list_endpoint_permissions()
        for row in rows:
            key = (row.route_path, row.http_method)
            row.is_active = key in active_keys

    async def commit(self) -> None:
        await self.session.commit()
