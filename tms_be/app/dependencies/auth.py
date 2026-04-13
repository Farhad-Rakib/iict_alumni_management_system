"""Dependency injection for authentication."""
from typing import Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import get_db_session
from app.models.user import User, RoleEnum
from app.core.security import decode_token
from app.core.rbac import get_permissions_for_role, has_permissions
from app.repositories.user import UserRepository
from app.services.rbac import RBACService

security = HTTPBearer()


async def get_current_user(
    credentials: Any = Depends(security),
    session: AsyncSession = Depends(get_db_session),
) -> User:
    """Get current authenticated user from JWT token."""
    token = credentials.credentials
    payload = decode_token(token)

    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(int(user_id))

    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    return user


async def get_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure user is admin or higher."""
    if current_user.role not in [RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


async def get_superadmin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure user is superadmin."""
    if current_user.role != RoleEnum.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required",
        )
    return current_user


def require_role(*roles: RoleEnum):
    """Create a dependency that checks if user has one of the specified roles."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return role_checker


def require_permission(*permissions: str, require_all: bool = False):
    """Create a dependency that checks if user has the required permissions."""

    async def permission_checker(
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_db_session),
    ) -> User:
        rbac_service = RBACService(session)
        user_permissions = await rbac_service.get_effective_permissions(current_user)
        if not user_permissions:
            user_permissions = get_permissions_for_role(current_user.role)
        if not has_permissions(user_permissions, permissions, require_all):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    # Attach metadata for automatic permission sync from route dependencies.
    permission_checker.required_permissions = tuple(permissions)
    permission_checker.require_all = require_all

    return permission_checker


async def get_optional_user(
    credentials: Any = Depends(security),
    session: AsyncSession = Depends(get_db_session),
) -> User | None:
    """Get current user if authenticated, otherwise None."""
    try:
        return await get_current_user(credentials, session)
    except HTTPException:
        return None
