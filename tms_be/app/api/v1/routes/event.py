"""Events API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import get_db_session
from app.dependencies.auth import get_current_user, require_permission
from app.models.user import User
from app.schemas.event import (
    EventCreateRequest,
    EventUpdateRequest,
    EventResponse,
    EventListResponse,
    EventRSVPRequest,
    EventRSVPResponse,
    PaginatedEventResponse,
)
from app.services.event import EventService

router = APIRouter(prefix="/api/v1/events", tags=["Events"])


@router.post("/", response_model=EventResponse)
async def create_event(
    request: EventCreateRequest,
    current_user: User = Depends(require_permission("events.create")),
    session: AsyncSession = Depends(get_db_session),
):
    """Create a new event."""
    event_service = EventService(session)
    return await event_service.create_event(request, current_user.id)


@router.get("/", response_model=PaginatedEventResponse)
async def list_events(
    skip: int = 0,
    limit: int = 20,
    session: AsyncSession = Depends(get_db_session),
):
    """List all published events."""
    event_service = EventService(session)
    return await event_service.list_events(skip=skip, limit=limit)


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: int,
    session: AsyncSession = Depends(get_db_session),
):
    """Get event details by ID."""
    event_service = EventService(session)
    return await event_service.get_event_by_id(event_id)


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    request: EventUpdateRequest,
    current_user: User = Depends(require_permission("events.edit")),
    session: AsyncSession = Depends(get_db_session),
):
    """Update event details."""
    event_service = EventService(session)
    return await event_service.update_event(event_id, request, current_user.id)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    current_user: User = Depends(require_permission("events.delete")),
    session: AsyncSession = Depends(get_db_session),
):
    """Delete an event."""
    event_service = EventService(session)
    await event_service.delete_event(event_id)


@router.post("/{event_id}/rsvp", response_model=EventRSVPResponse)
async def rsvp_event(
    event_id: int,
    request: EventRSVPRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """RSVP for an event."""
    event_service = EventService(session)
    return await event_service.rsvp_event(event_id, current_user.id)


@router.get("/{event_id}/rsvps", response_model=list[EventRSVPResponse])
async def get_event_rsvps(
    event_id: int,
    current_user: User = Depends(require_permission("events.view_rsvps")),
    session: AsyncSession = Depends(get_db_session),
):
    """Get RSVPs for an event."""
    event_service = EventService(session)
    return await event_service.get_event_rsvps(event_id)
