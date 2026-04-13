"""Service for CMS operations."""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.repositories.base import BaseRepository
from app.models.cms import CMSPage, Slider, Committee, Gallery, ContactInfo
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
from app.core.utils import get_utc_now


class CMSPageRepository(BaseRepository[CMSPage]):
    """Repository for CMS Page operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, CMSPage)

    async def get_by_slug(self, slug: str) -> CMSPage | None:
        """Get page by slug."""
        result = await self.session.execute(
            select(self.model).where(self.model.slug == slug)
        )
        return result.scalar_one_or_none()


class SliderRepository(BaseRepository[Slider]):
    """Repository for Slider operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, Slider)

    async def get_active_sliders(self) -> list[Slider]:
        """Get active sliders."""
        result = await self.session.execute(
            select(self.model).where(self.model.is_active == True).order_by(self.model.order)
        )
        return result.scalars().all()


class CommitteeRepository(BaseRepository[Committee]):
    """Repository for Committee operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, Committee)

    async def get_active_members(self) -> list[Committee]:
        """Get active committee members."""
        result = await self.session.execute(
            select(self.model).where(self.model.is_active == True).order_by(self.model.order)
        )
        return result.scalars().all()


class GalleryRepository(BaseRepository[Gallery]):
    """Repository for Gallery operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, Gallery)

    async def get_by_album(self, album: str) -> list[Gallery]:
        """Get gallery images by album."""
        result = await self.session.execute(
            select(self.model).where(
                (self.model.album == album) & (self.model.is_active == True)
            ).order_by(self.model.order)
        )
        return result.scalars().all()

    async def get_active_images(self) -> list[Gallery]:
        """Get all active gallery images."""
        result = await self.session.execute(
            select(self.model).where(self.model.is_active == True).order_by(self.model.order)
        )
        return result.scalars().all()


class ContactInfoRepository(BaseRepository[ContactInfo]):
    """Repository for Contact Info operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, ContactInfo)

    async def get_primary(self) -> ContactInfo | None:
        """Get primary contact info."""
        result = await self.session.execute(
            select(self.model).where(self.model.is_active == True).limit(1)
        )
        return result.scalar_one_or_none()


class CMSService:
    """Service for CMS operations."""

    def __init__(self, session: AsyncSession):
        self.page_repo = CMSPageRepository(session)
        self.slider_repo = SliderRepository(session)
        self.committee_repo = CommitteeRepository(session)
        self.gallery_repo = GalleryRepository(session)
        self.contact_repo = ContactInfoRepository(session)
        self.session = session

    # Pages
    async def create_page(self, request: PageCreateRequest) -> PageResponse:
        """Create a CMS page."""
        page = await self.page_repo.create(request.model_dump())
        await self.page_repo.commit()
        return page

    async def get_page_by_slug(self, slug: str) -> PageResponse:
        """Get page by slug."""
        page = await self.page_repo.get_by_slug(slug)
        if not page:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Page not found",
            )
        return page

    async def update_page(self, page_id: int, request: PageUpdateRequest) -> PageResponse:
        """Update a page."""
        page = await self.page_repo.get_by_id(page_id)
        if not page:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Page not found",
            )

        update_data = request.model_dump(exclude_unset=True)
        updated_page = await self.page_repo.update(page_id, update_data)
        await self.page_repo.commit()

        return updated_page

    # Sliders
    async def create_slider(self, request: SliderCreateRequest) -> SliderResponse:
        """Create a slider."""
        slider = await self.slider_repo.create(request.model_dump())
        await self.slider_repo.commit()
        return slider

    async def get_active_sliders(self) -> list[SliderResponse]:
        """Get active sliders."""
        sliders = await self.slider_repo.get_active_sliders()
        return [SliderResponse.model_validate(s) for s in sliders]

    async def update_slider(self, slider_id: int, request: SliderUpdateRequest) -> SliderResponse:
        """Update a slider."""
        slider = await self.slider_repo.get_by_id(slider_id)
        if not slider:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Slider not found",
            )

        update_data = request.model_dump(exclude_unset=True)
        updated_slider = await self.slider_repo.update(slider_id, update_data)
        await self.slider_repo.commit()

        return updated_slider

    # Committee
    async def create_committee_member(self, request: CommitteeCreateRequest) -> CommitteeResponse:
        """Create a committee member."""
        member = await self.committee_repo.create(request.model_dump())
        await self.committee_repo.commit()
        return member

    async def get_active_committee(self) -> list[CommitteeResponse]:
        """Get active committee members."""
        members = await self.committee_repo.get_active_members()
        return [CommitteeResponse.model_validate(m) for m in members]

    async def update_committee_member(self, member_id: int, request: CommitteeUpdateRequest) -> CommitteeResponse:
        """Update a committee member."""
        member = await self.committee_repo.get_by_id(member_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Committee member not found",
            )

        update_data = request.model_dump(exclude_unset=True)
        updated_member = await self.committee_repo.update(member_id, update_data)
        await self.committee_repo.commit()

        return updated_member

    # Gallery
    async def create_gallery_image(self, request: GalleryCreateRequest, user_id: int) -> GalleryResponse:
        """Create gallery image."""
        image_data = request.model_dump()
        image_data["uploaded_by"] = user_id

        image = await self.gallery_repo.create(image_data)
        await self.gallery_repo.commit()

        return image

    async def get_gallery_images(self, album: str = None) -> list[GalleryResponse]:
        """Get gallery images."""
        if album:
            images = await self.gallery_repo.get_by_album(album)
        else:
            images = await self.gallery_repo.get_active_images()

        return [GalleryResponse.model_validate(i) for i in images]

    # Contact Info
    async def get_contact_info(self) -> ContactInfoResponse:
        """Get contact information."""
        contact = await self.contact_repo.get_primary()
        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact information not found",
            )
        return contact

    async def update_contact_info(self, contact_id: int, request: dict) -> ContactInfoResponse:
        """Update contact information."""
        contact = await self.contact_repo.get_by_id(contact_id)
        if not contact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact information not found",
            )

        updated_contact = await self.contact_repo.update(contact_id, request)
        await self.contact_repo.commit()

        return updated_contact
