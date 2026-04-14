"""Pydantic schemas for events."""
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from datetime import datetime
from app.models.event import EventType


class EventCreateRequest(BaseModel):
    """Create event request."""
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(...)
    event_type: Optional[EventType] = None
    start_date: datetime
    end_date: datetime
    location: Optional[str] = None
    is_online: bool = False
    meeting_link: Optional[str] = None
    is_paid: bool = False
    fee: float = Field(0.0, ge=0)
    currency: str = "USD"
    max_capacity: Optional[int] = None
    organized_by: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Annual Alumni Meet",
                "description": "Main event",
                "event_type": "networking",
                "start_date": "2024-06-15T10:00:00",
                "end_date": "2024-06-15T16:00:00",
                "location": "Convention Center",
                "is_online": False,
                "is_paid": True,
                "fee": 50.0,
                "max_capacity": 500,
            }
        }


class EventUpdateRequest(BaseModel):
    """Update event request."""
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    is_online: Optional[bool] = None
    meeting_link: Optional[str] = None
    is_paid: Optional[bool] = None
    fee: Optional[float] = None
    max_capacity: Optional[int] = None
    organized_by: Optional[str] = None
    is_published: Optional[bool] = None


class EventResponse(BaseModel):
    """Event response."""
    id: int
    title: str
    description: str
    event_type: Optional[EventType] = None
    start_date: datetime
    end_date: datetime
    location: Optional[str] = None
    is_online: bool
    meeting_link: Optional[str] = None
    is_paid: bool
    fee: float
    currency: str
    max_capacity: Optional[int] = None
    is_published: bool
    organized_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EventListResponse(BaseModel):
    """Event list response."""
    id: int
    title: str
    start_date: datetime
    end_date: datetime
    location: Optional[str] = None
    is_paid: bool
    fee: float
    max_capacity: Optional[int] = None

    class Config:
        from_attributes = True


class EventRSVPRequest(BaseModel):
    """RSVP for event request."""
    pass  # Just a marker, no additional data needed


class EventRSVPResponse(BaseModel):
    """Event RSVP response."""
    id: int
    event_id: int
    user_id: int
    status: str
    registration_date: datetime

    class Config:
        from_attributes = True


class EventPaymentCreateRequest(BaseModel):
    """Create event payment request."""
    amount: float = Field(..., ge=0)
    currency: str = "USD"
    status: Optional[str] = None  # pending, completed, failed, refunded
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None


class EventPaymentResponse(BaseModel):
    """Event payment response."""
    id: int
    event_id: int
    user_id: int
    amount: float
    currency: str
    status: str
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedEventResponse(BaseModel):
    """Paginated events response."""
    items: List[EventListResponse]
    total: int
    skip: int
    limit: int
    page: int
    pages: int
