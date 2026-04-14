"""Pydantic schemas for elections."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ElectionCreateRequest(BaseModel):
    """Create election request."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    voting_start: datetime
    voting_end: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "title": "2024 Alumni Council Election",
                "description": "Vote for council members",
                "start_date": "2024-06-01T00:00:00",
                "end_date": "2024-06-30T23:59:59",
                "voting_start": "2024-06-15T08:00:00",
                "voting_end": "2024-06-20T18:00:00",
            }
        }


class ElectionResponse(BaseModel):
    """Election response."""
    id: int
    title: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    voting_start: datetime
    voting_end: datetime
    is_published: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ElectionUpdateRequest(BaseModel):
    """Update election request."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    voting_start: Optional[datetime] = None
    voting_end: Optional[datetime] = None
    is_published: Optional[bool] = None
    is_active: Optional[bool] = None


class PositionCreateRequest(BaseModel):
    """Create election position request."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    max_votes: int = Field(1, ge=1)


class PositionResponse(BaseModel):
    """Election position response."""
    id: int
    election_id: int
    name: str
    description: Optional[str] = None
    max_votes: int

    class Config:
        from_attributes = True


class CandidateCreateRequest(BaseModel):
    """Create candidate request."""
    user_id: int
    name: str
    bio: Optional[str] = None
    manifesto: Optional[str] = None


class CandidateResponse(BaseModel):
    """Candidate response."""
    id: int
    position_id: int
    user_id: int
    name: str
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    manifesto: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CandidateWithVotesResponse(CandidateResponse):
    """Candidate response with vote count."""
    votes: int = 0


class VoteRequest(BaseModel):
    """Vote request."""
    candidate_id: int

    class Config:
        json_schema_extra = {"example": {"candidate_id": 1}}


class VotingResultResponse(BaseModel):
    """Voting result response."""
    candidate_id: int
    candidate_name: str
    position_id: int
    votes: int
    percentage: float

    class Config:
        json_schema_extra = {
            "example": {
                "candidate_id": 1,
                "candidate_name": "John Doe",
                "position_id": 1,
                "votes": 150,
                "percentage": 45.5,
            }
        }


class ElectionResultResponse(BaseModel):
    """Election result response."""
    election_id: int
    election_title: str
    total_votes: int
    positions: List[dict]  # Position with candidates and votes
    created_at: datetime

    class Config:
        from_attributes = True


class VotingLogResponse(BaseModel):
    """Voting audit log response."""
    id: int
    election_id: int
    user_id: int
    user_email: Optional[str] = None
    action: str
    ip_address: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
