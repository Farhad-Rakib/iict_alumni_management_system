"""Utility functions."""
import random
import string
from typing import TypeVar, Generic, List
from datetime import datetime, timezone
import pyotp

T = TypeVar("T")


def generate_otp(length: int = 6) -> str:
    """Generate a random OTP."""
    return "".join(random.choices(string.digits, k=length))


def generate_verification_token(length: int = 32) -> str:
    """Generate a random verification token."""
    return "".join(random.choices(string.ascii_letters + string.digits, k=length))


def get_utc_now() -> datetime:
    """Get current UTC datetime."""
    return datetime.utcnow()


def is_expired(expiry_time: datetime, now: datetime = None) -> bool:
    """Check if a datetime has expired."""
    if now is None:
        now = get_utc_now()
    return now > expiry_time


class PaginationParams:
    """Pagination parameters."""

    def __init__(self, skip: int = 0, limit: int = 20):
        self.skip = max(0, skip)
        self.limit = min(100, max(1, limit))


class PagedResponse(Generic[T]):
    """Paged response model."""

    def __init__(
        self,
        items: List[T],
        total: int,
        skip: int,
        limit: int,
    ):
        self.items = items
        self.total = total
        self.skip = skip
        self.limit = limit
        self.page = (skip // limit) + 1 if limit > 0 else 1
        self.pages = (total + limit - 1) // limit if limit > 0 else 0
