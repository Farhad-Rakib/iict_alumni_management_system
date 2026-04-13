"""Database models for elections and voting."""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.base import Base


class Election(Base):
    """Election model."""
    __tablename__ = "elections"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Timing
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    voting_start = Column(DateTime, nullable=False)
    voting_end = Column(DateTime, nullable=False)
    
    is_published = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    positions = relationship("ElectionPosition", back_populates="election", cascade="all, delete-orphan")
    votes = relationship("Vote", back_populates="election", cascade="all, delete-orphan")
    voting_logs = relationship("VotingLog", back_populates="election", cascade="all, delete-orphan")


class ElectionPosition(Base):
    """Position in an election (e.g., President, Secretary)."""
    __tablename__ = "election_positions"

    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey("elections.id"), nullable=False)
    name = Column(String(100), nullable=False)  # President, Secretary, etc.
    description = Column(Text, nullable=True)
    max_votes = Column(Integer, default=1)  # Number of candidates that can be selected

    # Relationships
    election = relationship("Election", back_populates="positions")
    candidates = relationship("Candidate", back_populates="position", cascade="all, delete-orphan")


class Candidate(Base):
    """Candidate for an election position."""
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    position_id = Column(Integer, ForeignKey("election_positions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    name = Column(String(255), nullable=False)
    bio = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)
    manifesto = Column(Text, nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    position = relationship("ElectionPosition", back_populates="candidates")
    votes = relationship("Vote", back_populates="candidate", cascade="all, delete-orphan")


class Vote(Base):
    """Vote record."""
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey("elections.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Unique constraint to prevent duplicate voting
    __table_args__ = (
        UniqueConstraint('election_id', 'user_id', 'candidate_id', name='uq_election_user_candidate'),
    )

    # Relationships
    election = relationship("Election", back_populates="votes")
    candidate = relationship("Candidate", back_populates="votes")


class VotingLog(Base):
    """Audit log for voting activities."""
    __tablename__ = "voting_logs"

    id = Column(Integer, primary_key=True, index=True)
    election_id = Column(Integer, ForeignKey("elections.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    action = Column(String(50), nullable=False)  # voted, attempted, blocked
    ip_address = Column(String(45), nullable=True)
    reason = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    election = relationship("Election", back_populates="voting_logs")
    user = relationship("User", back_populates="voting_logs")
