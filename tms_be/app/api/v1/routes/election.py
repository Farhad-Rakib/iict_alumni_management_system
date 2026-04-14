"""Elections API routes."""
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import get_db_session
from app.dependencies.auth import get_current_user, require_permission
from app.models.user import User
from app.schemas.election import (
    ElectionCreateRequest,
    ElectionUpdateRequest,
    ElectionResponse,
    PositionCreateRequest,
    PositionResponse,
    CandidateCreateRequest,
    CandidateResponse,
    CandidateWithVotesResponse,
    VoteRequest,
    ElectionResultResponse,
    VotingLogResponse,
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


@router.get("/", response_model=list[ElectionResponse], dependencies=[Depends(require_permission("elections.view"))])
async def list_elections(
    session: AsyncSession = Depends(get_db_session),
):
    """List all elections."""
    election_service = ElectionService(session)
    return await election_service.list_elections()


@router.get("/{election_id}", response_model=ElectionResponse, dependencies=[Depends(require_permission("elections.view"))])
async def get_election(
    election_id: int,
    session: AsyncSession = Depends(get_db_session),
):
    """Get election details."""
    election_service = ElectionService(session)
    return await election_service.get_election_by_id(election_id)


@router.put(
    "/{election_id}",
    response_model=ElectionResponse,
    dependencies=[Depends(require_permission("elections.manage"))],
)
async def update_election(
    election_id: int,
    request: ElectionUpdateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Update an election."""
    election_service = ElectionService(session)
    return await election_service.update_election(election_id, request)


@router.delete(
    "/{election_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("elections.manage"))],
)
async def delete_election(
    election_id: int,
    session: AsyncSession = Depends(get_db_session),
):
    """Delete an election."""
    election_service = ElectionService(session)
    await election_service.delete_election(election_id)


@router.post("/{election_id}/positions", response_model=PositionResponse, dependencies=[Depends(require_permission("elections.manage"))])
async def add_position(
    election_id: int,
    request: PositionCreateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Add a position to an election."""
    election_service = ElectionService(session)
    return await election_service.add_position(election_id, request)


@router.get("/{election_id}/positions", response_model=list[PositionResponse], dependencies=[Depends(require_permission("elections.view"))])
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


@router.get("/{position_id}/candidates", response_model=list[CandidateResponse], dependencies=[Depends(require_permission("elections.view"))])
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
    http_request: Request,
    current_user: User = Depends(require_permission("elections.vote")),
    session: AsyncSession = Depends(get_db_session),
):
    """Cast a vote."""
    election_service = ElectionService(session)
    return await election_service.cast_vote(
        election_id,
        current_user.id,
        request.candidate_id,
        ip_address=http_request.client.host if http_request.client else None,
        user_agent=http_request.headers.get("user-agent"),
    )


@router.get(
    "/{election_id}/results",
    response_model=ElectionResultResponse,
    dependencies=[Depends(require_permission("elections.results"))],
)
async def get_results(
    election_id: int,
    session: AsyncSession = Depends(get_db_session),
):
    """Get voting results for an election."""
    election_service = ElectionService(session)
    return await election_service.get_voting_results(election_id)


@router.get(
    "/{election_id}/logs",
    response_model=list[VotingLogResponse],
    dependencies=[Depends(require_permission("elections.manage"))],
)
async def get_voting_logs(
    election_id: int,
    limit: int = 200,
    session: AsyncSession = Depends(get_db_session),
):
    """Get voting audit logs for an election."""
    election_service = ElectionService(session)
    return await election_service.get_voting_logs(election_id, limit)
