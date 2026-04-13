"""Service for election operations."""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.repositories.base import BaseRepository
from app.models.election import Election, ElectionPosition, Candidate, Vote, VotingLog
from app.schemas.election import (
    ElectionCreateRequest,
    ElectionResponse,
    PositionCreateRequest,
    PositionResponse,
    CandidateCreateRequest,
    CandidateResponse,
    ElectionResultResponse,
)
from app.core.utils import get_utc_now


class ElectionRepository(BaseRepository[Election]):
    """Repository for Election operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, Election)


class PositionRepository(BaseRepository[ElectionPosition]):
    """Repository for Position operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, ElectionPosition)

    async def get_by_election(self, election_id: int) -> list[ElectionPosition]:
        """Get positions for an election."""
        result = await self.session.execute(
            select(self.model).where(self.model.election_id == election_id)
        )
        return result.scalars().all()


class CandidateRepository(BaseRepository[Candidate]):
    """Repository for Candidate operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, Candidate)

    async def get_by_position(self, position_id: int) -> list[Candidate]:
        """Get candidates for a position."""
        result = await self.session.execute(
            select(self.model).where(self.model.position_id == position_id)
        )
        return result.scalars().all()


class VoteRepository(BaseRepository[Vote]):
    """Repository for Vote operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, Vote)

    async def get_user_votes(self, election_id: int, user_id: int) -> list[Vote]:
        """Get all votes by a user in an election."""
        result = await self.session.execute(
            select(self.model).where(
                (self.model.election_id == election_id) & (self.model.user_id == user_id)
            )
        )
        return result.scalars().all()

    async def count_candidate_votes(self, candidate_id: int) -> int:
        """Count votes for a candidate."""
        result = await self.session.execute(
            select(func.count(self.model.id)).where(self.model.candidate_id == candidate_id)
        )
        return result.scalar() or 0


class ElectionService:
    """Service for election operations."""

    def __init__(self, session: AsyncSession):
        self.election_repo = ElectionRepository(session)
        self.position_repo = PositionRepository(session)
        self.candidate_repo = CandidateRepository(session)
        self.vote_repo = VoteRepository(session)
        self.session = session

    async def create_election(self, request: ElectionCreateRequest, user_id: int) -> ElectionResponse:
        """Create a new election."""
        election_data = request.model_dump()
        election_data["created_by"] = user_id

        election = await self.election_repo.create(election_data)
        await self.election_repo.commit()

        return election

    async def get_election_by_id(self, election_id: int) -> ElectionResponse:
        """Get election by ID."""
        election = await self.election_repo.get_by_id(election_id)
        if not election:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Election not found",
            )
        return election

    async def list_elections(self) -> list[ElectionResponse]:
        """List all elections."""
        elections = await self.election_repo.get_all(skip=0, limit=1000)
        return [ElectionResponse.model_validate(e) for e in elections]

    async def add_position(self, election_id: int, request: PositionCreateRequest) -> PositionResponse:
        """Add a position to an election."""
        election = await self.election_repo.get_by_id(election_id)
        if not election:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Election not found",
            )

        position_data = request.model_dump()
        position_data["election_id"] = election_id

        position = await self.position_repo.create(position_data)
        await self.position_repo.commit()

        return position

    async def get_positions(self, election_id: int) -> list[PositionResponse]:
        """Get positions for an election."""
        positions = await self.position_repo.get_by_election(election_id)
        return [PositionResponse.model_validate(p) for p in positions]

    async def add_candidate(self, position_id: int, request: CandidateCreateRequest) -> CandidateResponse:
        """Add a candidate to a position."""
        position = await self.position_repo.get_by_id(position_id)
        if not position:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Position not found",
            )

        candidate_data = request.model_dump()
        candidate_data["position_id"] = position_id

        candidate = await self.candidate_repo.create(candidate_data)
        await self.candidate_repo.commit()

        return candidate

    async def get_candidates(self, position_id: int) -> list[CandidateResponse]:
        """Get candidates for a position."""
        candidates = await self.candidate_repo.get_by_position(position_id)
        return [CandidateResponse.model_validate(c) for c in candidates]

    async def cast_vote(self, election_id: int, user_id: int, candidate_id: int) -> dict:
        """Cast a vote."""
        election = await self.election_repo.get_by_id(election_id)
        if not election:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Election not found",
            )

        # Check if voting is open
        now = get_utc_now()
        if now < election.voting_start or now > election.voting_end:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Voting is not open",
            )

        candidate = await self.candidate_repo.get_by_id(candidate_id)
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate not found",
            )

        # Check if candidate belongs to this election
        position = await self.position_repo.get_by_id(candidate.position_id)
        if position.election_id != election_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate not in this election",
            )

        # Check if user already voted for same candidate
        existing = await self.session.execute(
            select(Vote).where(
                (Vote.election_id == election_id) &
                (Vote.user_id == user_id) &
                (Vote.candidate_id == candidate_id)
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already voted for this candidate",
            )

        # Cast vote
        vote_data = {
            "election_id": election_id,
            "user_id": user_id,
            "candidate_id": candidate_id,
        }
        vote = await self.vote_repo.create(vote_data)
        await self.vote_repo.commit()

        return {"message": "Vote recorded"}

    async def get_voting_results(self, election_id: int) -> ElectionResultResponse:
        """Get voting results for an election."""
        election = await self.election_repo.get_by_id(election_id)
        if not election:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Election not found",
            )

        # Get total votes
        total_votes_result = await self.session.execute(
            select(func.count(Vote.id)).where(Vote.election_id == election_id)
        )
        total_votes = total_votes_result.scalar() or 0

        # Get positions with candidates and votes
        positions_data = []
        positions = await self.position_repo.get_by_election(election_id)

        for position in positions:
            candidates_data = []
            candidates = await self.candidate_repo.get_by_position(position.id)

            for candidate in candidates:
                vote_count = await self.vote_repo.count_candidate_votes(candidate.id)
                percentage = (vote_count / total_votes * 100) if total_votes > 0 else 0

                candidates_data.append({
                    "candidate_id": candidate.id,
                    "candidate_name": candidate.name,
                    "votes": vote_count,
                    "percentage": round(percentage, 2),
                })

            positions_data.append({
                "position_id": position.id,
                "position_name": position.name,
                "candidates": candidates_data,
            })

        return ElectionResultResponse(
            election_id=election_id,
            election_title=election.title,
            total_votes=total_votes,
            positions=positions_data,
            created_at=get_utc_now(),
        )
