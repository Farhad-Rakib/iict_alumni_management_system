"""Menu API routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db_session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.menu import MenuItemResponse
from app.services.menu import MenuService

router = APIRouter(prefix="/api/v1/menu", tags=["Menu"])


@router.get("", response_model=list[MenuItemResponse])
async def get_current_user_menu(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    service = MenuService(session)
    return await service.get_menu_for_user(current_user)
