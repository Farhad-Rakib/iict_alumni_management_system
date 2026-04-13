"""Service for event operations."""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.repositories.base import BaseRepository
from app.models.event import Event, EventRSVP, EventPayment
from app.schemas.event import (
    EventCreateRequest,
    EventUpdateRequest,
    EventResponse,
    EventListResponse,
    EventRSVPResponse,
    PaginatedEventResponse,
)
from app.core.utils import get_utc_now


class EventRepository(BaseRepository[Event]):
    """Repository for Event operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, Event)

    async def get_active_events(self, skip: int = 0, limit: int = 20) -> tuple[list[Event], int]:
        """Get active published events."""
        query = select(self.model).where(self.model.is_published == True)
        count_result = await self.session.execute(
            select(func.count(self.model.id)).where(self.model.is_published == True)
        )
        total = count_result.scalar() or 0

        result = await self.session.execute(query.offset(skip).limit(limit))
        return result.scalars().all(), total


class EventRSVPRepository(BaseRepository[EventRSVP]):
    """Repository for Event RSVP operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, EventRSVP)

    async def get_by_event_and_user(self, event_id: int, user_id: int) -> EventRSVP | None:
        """Get RSVP for specific event and user."""
        result = await self.session.execute(
            select(self.model).where(
                (self.model.event_id == event_id) & (self.model.user_id == user_id)
            )
        )
        return result.scalar_one_or_none()

    async def get_by_event(self, event_id: int) -> list[EventRSVP]:
        """Get all RSVPs for an event."""
        result = await self.session.execute(
            select(self.model).where(self.model.event_id == event_id)
        )
        return result.scalars().all()


class EventService:
    """Service for event operations."""

    def __init__(self, session: AsyncSession):
        self.event_repo = EventRepository(session)
        self.rsvp_repo = EventRSVPRepository(session)
        self.session = session

    async def create_event(self, request: EventCreateRequest, user_id: int) -> EventResponse:
        """Create a new event."""
        event_data = request.model_dump()
        event_data["created_by"] = user_id

        event = await self.event_repo.create(event_data)
        await self.event_repo.commit()

        return event

    async def get_event_by_id(self, event_id: int) -> EventResponse:
        """Get event by ID."""
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )
        return event

    async def update_event(self, event_id: int, request: EventUpdateRequest, user_id: int) -> EventResponse:
        """Update event."""
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        # Only creator or admin can update
        if event.created_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this event",
            )

        update_data = request.model_dump(exclude_unset=True)
        updated_event = await self.event_repo.update(event_id, update_data)
        await self.event_repo.commit()

        return updated_event

    async def list_events(self, skip: int = 0, limit: int = 20) -> PaginatedEventResponse:
        """List published events."""
        events, total = await self.event_repo.get_active_events(skip=skip, limit=limit)

        items = [EventListResponse.model_validate(e) for e in events]

        return PaginatedEventResponse(
            items=items,
            total=total,
            skip=skip,
            limit=limit,
            page=(skip // limit) + 1 if limit > 0 else 1,
            pages=(total + limit - 1) // limit if limit > 0 else 0,
        )

    async def delete_event(self, event_id: int) -> None:
        """Delete event."""
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        await self.event_repo.delete(event_id)
        await self.event_repo.commit()

    async def rsvp_event(self, event_id: int, user_id: int) -> EventRSVPResponse:
        """RSVP for an event."""
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        # Check if already registered
        existing_rsvp = await self.rsvp_repo.get_by_event_and_user(event_id, user_id)
        if existing_rsvp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already registered for this event",
            )

        rsvp_data = {
            "event_id": event_id,
            "user_id": user_id,
            "status": "registered",
        }
        rsvp = await self.rsvp_repo.create(rsvp_data)
        await self.rsvp_repo.commit()

        return rsvp

    async def get_event_rsvps(self, event_id: int) -> list[EventRSVPResponse]:
        """Get RSVPs for an event."""
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        rsvps = await self.rsvp_repo.get_by_event(event_id)
        return [EventRSVPResponse.model_validate(r) for r in rsvps]
