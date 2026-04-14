"""Service for election operations."""
from sqlalchemy import and_, desc
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.repositories.base import BaseRepository
from app.repositories.user import UserRepository
from app.models.user import User
from app.models.election import Election, ElectionPosition, Candidate, Vote, VotingLog
from app.schemas.election import (
    ElectionCreateRequest,
    ElectionUpdateRequest,
    ElectionResponse,
    PositionCreateRequest,
    PositionResponse,
    CandidateCreateRequest,
    CandidateResponse,
    ElectionResultResponse,
    VotingLogResponse,
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

    async def get_user_position_votes(
        self,
        election_id: int,
        user_id: int,
        position_id: int,
    ) -> list[Vote]:
        """Get all votes by a user for a specific position in an election."""
        result = await self.session.execute(
            select(Vote)
            .join(Candidate, Vote.candidate_id == Candidate.id)
            .where(
                and_(
                    Vote.election_id == election_id,
                    Vote.user_id == user_id,
                    Candidate.position_id == position_id,
                )
            )
        )
        return result.scalars().all()


class VotingLogRepository(BaseRepository[VotingLog]):
    """Repository for voting audit logs."""

    def __init__(self, session: AsyncSession):
        super().__init__(session, VotingLog)


class ElectionService:
    """Service for election operations."""

    def __init__(self, session: AsyncSession):
        self.election_repo = ElectionRepository(session)
        self.position_repo = PositionRepository(session)
        self.candidate_repo = CandidateRepository(session)
        self.vote_repo = VoteRepository(session)
        self.voting_log_repo = VotingLogRepository(session)
        self.user_repo = UserRepository(session)
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

    async def update_election(
        self,
        election_id: int,
        request: ElectionUpdateRequest,
    ) -> ElectionResponse:
        """Update an election."""
        election = await self.election_repo.get_by_id(election_id)
        if not election:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Election not found",
            )

        update_data = request.model_dump(exclude_unset=True)
        if not update_data:
            return election

        updated = await self.election_repo.update(election_id, update_data)
        await self.election_repo.commit()
        return updated

    async def delete_election(self, election_id: int) -> None:
        """Delete an election."""
        election = await self.election_repo.get_by_id(election_id)
        if not election:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Election not found",
            )
        await self.election_repo.delete(election_id)
        await self.election_repo.commit()

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

        candidate_user = await self.user_repo.get_by_id(request.user_id)
        if not candidate_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate user not found",
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

    async def cast_vote(
        self,
        election_id: int,
        user_id: int,
        candidate_id: int,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict:
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
            await self.voting_log_repo.create(
                {
                    "election_id": election_id,
                    "user_id": user_id,
                    "action": "blocked",
                    "ip_address": ip_address,
                    "reason": "Voting window closed",
                }
            )
            await self.voting_log_repo.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Voting is not open",
            )

        candidate = await self.candidate_repo.get_by_id(candidate_id)
        if not candidate:
            await self.voting_log_repo.create(
                {
                    "election_id": election_id,
                    "user_id": user_id,
                    "action": "attempted",
                    "ip_address": ip_address,
                    "reason": "Candidate not found",
                }
            )
            await self.voting_log_repo.commit()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate not found",
            )

        # Check if candidate belongs to this election
        position = await self.position_repo.get_by_id(candidate.position_id)
        if position.election_id != election_id:
            await self.voting_log_repo.create(
                {
                    "election_id": election_id,
                    "user_id": user_id,
                    "action": "blocked",
                    "ip_address": ip_address,
                    "reason": "Candidate outside election",
                }
            )
            await self.voting_log_repo.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate not in this election",
            )

        # Enforce one vote per user per position (max_votes default is 1).
        existing_position_votes = await self.vote_repo.get_user_position_votes(
            election_id,
            user_id,
            position.id,
        )
        if len(existing_position_votes) >= position.max_votes:
            await self.voting_log_repo.create(
                {
                    "election_id": election_id,
                    "user_id": user_id,
                    "action": "blocked",
                    "ip_address": ip_address,
                    "reason": f"Already voted max {position.max_votes} time(s) for position",
                }
            )
            await self.voting_log_repo.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already used your vote quota for this position",
            )

        # Cast vote
        vote_data = {
            "election_id": election_id,
            "user_id": user_id,
            "candidate_id": candidate_id,
            "ip_address": ip_address,
            "user_agent": user_agent,
        }
        await self.vote_repo.create(vote_data)
        await self.voting_log_repo.create(
            {
                "election_id": election_id,
                "user_id": user_id,
                "action": "voted",
                "ip_address": ip_address,
                "reason": f"candidate_id={candidate_id}",
            }
        )
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

    async def get_voting_logs(self, election_id: int, limit: int = 200) -> list[VotingLogResponse]:
        """Get recent voting audit logs for an election."""
        election = await self.election_repo.get_by_id(election_id)
        if not election:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Election not found",
            )

        # Query directly with VotingLog + User email, most recent first.
        rows = await self.session.execute(
            select(VotingLog, User.email)
            .join(User, VotingLog.user_id == User.id)
            .where(VotingLog.election_id == election_id)
            .order_by(desc(VotingLog.created_at))
            .limit(limit)
        )

        logs: list[VotingLogResponse] = []
        for log, user_email in rows.all():
            logs.append(
                VotingLogResponse(
                    id=log.id,
                    election_id=log.election_id,
                    user_id=log.user_id,
                    user_email=user_email,
                    action=log.action,
                    ip_address=log.ip_address,
                    reason=log.reason,
                    created_at=log.created_at,
                )
            )
        return logs
