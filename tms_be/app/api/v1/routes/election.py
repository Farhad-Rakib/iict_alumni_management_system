"""Elections API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import get_db_session
from app.dependencies.auth import get_current_user, require_permission
from app.models.user import User
from app.schemas.election import (
    ElectionCreateRequest,
    ElectionResponse,
    PositionCreateRequest,
    PositionResponse,
    CandidateCreateRequest,
    CandidateResponse,
    CandidateWithVotesResponse,
    VoteRequest,
    ElectionResultResponse,
)
from app.services.election import ElectionService

router = APIRouter(prefix="/api/v1/elections", tags=["Elections"])


@router.post("/", response_model=ElectionResponse, dependencies=[Depends(require_permission("elections.manage"))])
async def create_election(
    request: ElectionCreateRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Create a new election."""
    election_service = ElectionService(session)
    return await election_service.create_election(request, current_user.id)


@router.get("/", response_model=list[ElectionResponse])
async def list_elections(
    session: AsyncSession = Depends(get_db_session),
):
    """List all elections."""
    election_service = ElectionService(session)
    return await election_service.list_elections()


@router.get("/{election_id}", response_model=ElectionResponse)
async def get_election(
    election_id: int,
    session: AsyncSession = Depends(get_db_session),
):
    """Get election details."""
    election_service = ElectionService(session)
    return await election_service.get_election_by_id(election_id)


@router.post("/{election_id}/positions", response_model=PositionResponse, dependencies=[Depends(require_permission("elections.manage"))])
async def add_position(
    election_id: int,
    request: PositionCreateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Add a position to an election."""
    election_service = ElectionService(session)
    return await election_service.add_position(election_id, request)


@router.get("/{election_id}/positions", response_model=list[PositionResponse])
async def get_positions(
    election_id: int,
    session: AsyncSession = Depends(get_db_session),
):
    """Get all positions for an election."""
    election_service = ElectionService(session)
    return await election_service.get_positions(election_id)


@router.post("/{position_id}/candidates", response_model=CandidateResponse, dependencies=[Depends(require_permission("elections.manage"))])
async def add_candidate(
    position_id: int,
    request: CandidateCreateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Add a candidate to a position."""
    election_service = ElectionService(session)
    return await election_service.add_candidate(position_id, request)


@router.get("/{position_id}/candidates", response_model=list[CandidateResponse])
async def get_candidates(
    position_id: int,
    session: AsyncSession = Depends(get_db_session),
):
    """Get all candidates for a position."""
    election_service = ElectionService(session)
    return await election_service.get_candidates(position_id)


@router.post("/{election_id}/vote", response_model=dict)
async def cast_vote(
    election_id: int,
    request: VoteRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    """Cast a vote."""
    election_service = ElectionService(session)
    return await election_service.cast_vote(election_id, current_user.id, request.candidate_id)


@router.get("/{election_id}/results", response_model=ElectionResultResponse)
async def get_results(
    election_id: int,
    session: AsyncSession = Depends(get_db_session),
):
    """Get voting results for an election."""
    election_service = ElectionService(session)
    return await election_service.get_voting_results(election_id)
