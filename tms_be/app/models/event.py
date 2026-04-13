"""Database models for events."""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base
import enum as python_enum


class EventType(str, python_enum.Enum):
    """Event type."""
    WEBINAR = "webinar"
    WORKSHOP = "workshop"
    CONFERENCE = "conference"
    NETWORKING = "networking"
    SOCIAL = "social"
    AWARD = "award"
    OTHER = "other"


class Event(Base):
    """Event model."""
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    event_type = Column(Enum(EventType), default=EventType.OTHER)
    
    # Date and Time
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    
    # Location
    location = Column(String(255), nullable=True)
    is_online = Column(Boolean, default=False)
    meeting_link = Column(String(500), nullable=True)
    
    # Payment
    is_paid = Column(Boolean, default=False)
    fee = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    
    # Capacity
    max_capacity = Column(Integer, nullable=True)
    
    # Status
    is_published = Column(Boolean, default=False)
    
    # Organizer
    organized_by = Column(String(255), nullable=True)
    
    # Timestamps
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    rsvps = relationship("EventRSVP", back_populates="event", cascade="all, delete-orphan")
    payments = relationship("EventPayment", back_populates="event", cascade="all, delete-orphan")


class EventRSVP(Base):
    """Event RSVP/Registration."""
    __tablename__ = "event_rsvps"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    status = Column(String(20), default="registered")  # registered, attended, cancelled, no_show
    registration_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    attended_at = Column(DateTime, nullable=True)
    
    # For paid events
    payment_id = Column(Integer, ForeignKey("event_payments.id"), nullable=True)

    event = relationship("Event", back_populates="rsvps")


class EventPayment(Base):
    """Event payment tracking."""
    __tablename__ = "event_payments"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD")
    status = Column(String(20), default="pending")  # pending, completed, failed, refunded
    
    payment_method = Column(String(50), nullable=True)  # stripe, paypal, bank_transfer
    transaction_id = Column(String(255), nullable=True, unique=True)
    
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    event = relationship("Event", back_populates="payments")
