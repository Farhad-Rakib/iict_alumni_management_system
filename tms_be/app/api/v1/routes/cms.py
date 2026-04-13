"""CMS API routes."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import get_db_session
from app.dependencies.auth import get_current_user, require_permission
from app.models.user import User
from app.schemas.cms import (
    PageCreateRequest,
    PageUpdateRequest,
    PageResponse,
    SliderCreateRequest,
    SliderUpdateRequest,
    SliderResponse,
    CommitteeCreateRequest,
    CommitteeUpdateRequest,
    CommitteeResponse,
    GalleryCreateRequest,
    GalleryResponse,
    ContactInfoResponse,
)
from app.services.cms import CMSService

router = APIRouter(prefix="/api/v1/cms", tags=["CMS"])


# Pages
@router.post("/pages", response_model=PageResponse, dependencies=[Depends(require_permission("cms.manage"))])
async def create_page(
    request: PageCreateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Create a CMS page."""
    cms_service = CMSService(session)
    return await cms_service.create_page(request)


@router.get("/pages/{slug}", response_model=PageResponse)
async def get_page(
    slug: str,
    session: AsyncSession = Depends(get_db_session),
):
    """Get CMS page by slug."""
    cms_service = CMSService(session)
    return await cms_service.get_page_by_slug(slug)


@router.put("/pages/{page_id}", response_model=PageResponse, dependencies=[Depends(require_permission("cms.manage"))])
async def update_page(
    page_id: int,
    request: PageUpdateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Update a CMS page."""
    cms_service = CMSService(session)
    return await cms_service.update_page(page_id, request)


# Sliders
@router.post("/sliders", response_model=SliderResponse, dependencies=[Depends(require_permission("cms.manage"))])
async def create_slider(
    request: SliderCreateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Create a slider image."""
    cms_service = CMSService(session)
    return await cms_service.create_slider(request)


@router.get("/sliders", response_model=list[SliderResponse])
async def get_sliders(
    session: AsyncSession = Depends(get_db_session),
):
    """Get all active sliders."""
    cms_service = CMSService(session)
    return await cms_service.get_active_sliders()


@router.put("/sliders/{slider_id}", response_model=SliderResponse, dependencies=[Depends(require_permission("cms.manage"))])
async def update_slider(
    slider_id: int,
    request: SliderUpdateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Update a slider."""
    cms_service = CMSService(session)
    return await cms_service.update_slider(slider_id, request)


# Committee
@router.post("/committee", response_model=CommitteeResponse, dependencies=[Depends(require_permission("cms.manage"))])
async def create_committee_member(
    request: CommitteeCreateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Create a committee member."""
    cms_service = CMSService(session)
    return await cms_service.create_committee_member(request)


@router.get("/committee", response_model=list[CommitteeResponse])
async def get_committee(
    session: AsyncSession = Depends(get_db_session),
):
    """Get active committee members."""
    cms_service = CMSService(session)
    return await cms_service.get_active_committee()


@router.put("/committee/{member_id}", response_model=CommitteeResponse, dependencies=[Depends(require_permission("cms.manage"))])
async def update_committee_member(
    member_id: int,
    request: CommitteeUpdateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Update a committee member."""
    cms_service = CMSService(session)
    return await cms_service.update_committee_member(member_id, request)


# Gallery
@router.post("/gallery", response_model=GalleryResponse, dependencies=[Depends(require_permission("cms.manage"))])
async def upload_gallery_image(
    request: GalleryCreateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Upload a gallery image."""
    cms_service = CMSService(session)
    return await cms_service.create_gallery_image(request, current_user.id)


@router.get("/gallery", response_model=list[GalleryResponse])
async def get_gallery(
    album: str = None,
    session: AsyncSession = Depends(get_db_session),
):
    """Get gallery images."""
    cms_service = CMSService(session)
    return await cms_service.get_gallery_images(album=album)


# Contact Info
@router.get("/contact", response_model=ContactInfoResponse)
async def get_contact_info(
    session: AsyncSession = Depends(get_db_session),
):
    """Get contact information."""
    cms_service = CMSService(session)
    return await cms_service.get_contact_info()


@router.put("/contact/{contact_id}", response_model=ContactInfoResponse, dependencies=[Depends(require_permission("cms.manage"))])
async def update_contact_info(
    contact_id: int,
    request: dict,
    session: AsyncSession = Depends(get_db_session),
):
    """Update contact information."""
    cms_service = CMSService(session)
    return await cms_service.update_contact_info(contact_id, request)
