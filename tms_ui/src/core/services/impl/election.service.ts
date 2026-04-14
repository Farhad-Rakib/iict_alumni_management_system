import { BaseRepository } from '../../api/base.repository';
import {
  Election,
  ElectionListItem,
  ElectionPosition,
  Candidate,
  ElectionResult,
  VotingLogEntry,
} from '../../../domain/models/election.model';
import {
  ElectionCreateRequestDto,
  ElectionUpdateRequestDto,
  PositionCreateRequestDto,
  CandidateCreateRequestDto,
  VoteRequestDto,
} from '../../../domain/dto/election.dto';
import { IElectionService } from '../election.service.interface';

interface ElectionResponse {
  id: number;
  title: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  voting_start: string;
  voting_end: string;
  is_published: boolean;
  is_active: boolean;
  created_at: string;
}

interface PositionResponse {
  id: number;
  election_id: number;
  name: string;
  description?: string | null;
  max_votes: number;
}

interface CandidateResponse {
  id: number;
  position_id: number;
  user_id: number;
  name: string;
  bio?: string | null;
  photo_url?: string | null;
  manifesto?: string | null;
  is_active: boolean;
  created_at: string;
}

interface ElectionResultResponse {
  election_id: number;
  election_title: string;
  total_votes: number;
  positions: Array<{
    position_id: number;
    position_name: string;
    candidates: Array<{
      candidate_id: number;
      candidate_name: string;
      votes: number;
      percentage: number;
    }>;
  }>;
  created_at: string;
}

interface VotingLogResponse {
  id: number;
  election_id: number;
  user_id: number;
  user_email?: string | null;
  action: string;
  ip_address?: string | null;
  reason?: string | null;
  created_at: string;
}

const mapElection = (item: ElectionResponse): Election => ({
  id: item.id,
  title: item.title,
  description: item.description || undefined,
  startDate: item.start_date,
  endDate: item.end_date,
  votingStart: item.voting_start,
  votingEnd: item.voting_end,
  isPublished: item.is_published,
  isActive: item.is_active,
  createdAt: item.created_at,
});

const mapElectionListItem = (item: ElectionResponse): ElectionListItem => ({
  id: item.id,
  title: item.title,
  startDate: item.start_date,
  endDate: item.end_date,
  votingStart: item.voting_start,
  votingEnd: item.voting_end,
  isPublished: item.is_published,
  isActive: item.is_active,
});

const mapPosition = (item: PositionResponse): ElectionPosition => ({
  id: item.id,
  electionId: item.election_id,
  name: item.name,
  description: item.description || undefined,
  maxVotes: item.max_votes,
});

const mapCandidate = (item: CandidateResponse): Candidate => ({
  id: item.id,
  positionId: item.position_id,
  userId: item.user_id,
  name: item.name,
  bio: item.bio || undefined,
  photoUrl: item.photo_url || undefined,
  manifesto: item.manifesto || undefined,
  isActive: item.is_active,
  createdAt: item.created_at,
});

const mapResult = (item: ElectionResultResponse): ElectionResult => ({
  electionId: item.election_id,
  electionTitle: item.election_title,
  totalVotes: item.total_votes,
  positions: item.positions.map((position) => ({
    positionId: position.position_id,
    positionName: position.position_name,
    candidates: position.candidates.map((candidate) => ({
      candidateId: candidate.candidate_id,
      candidateName: candidate.candidate_name,
      votes: candidate.votes,
      percentage: candidate.percentage,
    })),
  })),
  createdAt: item.created_at,
});

const mapVotingLog = (item: VotingLogResponse): VotingLogEntry => ({
  id: item.id,
  electionId: item.election_id,
  userId: item.user_id,
  userEmail: item.user_email || undefined,
  action: item.action,
  ipAddress: item.ip_address || undefined,
  reason: item.reason || undefined,
  createdAt: item.created_at,
});

const toCreateElectionPayload = (dto: ElectionCreateRequestDto) => ({
  title: dto.title,
  description: dto.description,
  start_date: dto.startDate,
  end_date: dto.endDate,
  voting_start: dto.votingStart,
  voting_end: dto.votingEnd,
});

const toUpdateElectionPayload = (dto: ElectionUpdateRequestDto) => ({
  title: dto.title,
  description: dto.description,
  start_date: dto.startDate,
  end_date: dto.endDate,
  voting_start: dto.votingStart,
  voting_end: dto.votingEnd,
  is_published: dto.isPublished,
  is_active: dto.isActive,
});

const toPositionPayload = (dto: PositionCreateRequestDto) => ({
  name: dto.name,
  description: dto.description,
  max_votes: dto.maxVotes || 1,
});

const toCandidatePayload = (dto: CandidateCreateRequestDto) => ({
  user_id: dto.userId,
  name: dto.name,
  bio: dto.bio,
  manifesto: dto.manifesto,
});

const toVotePayload = (dto: VoteRequestDto) => ({
  candidate_id: dto.candidateId,
});

export class ElectionService extends BaseRepository implements IElectionService {
  constructor() {
    super('/elections');
  }

  async getElections(): Promise<ElectionListItem[]> {
    const response = await this.get<ElectionResponse[]>('/');
    return response.map(mapElectionListItem);
  }

  async getElectionById(id: number): Promise<Election> {
    const response = await this.get<ElectionResponse>(`/${id}`);
    return mapElection(response);
  }

  async createElection(dto: ElectionCreateRequestDto): Promise<Election> {
    const response = await this.post<ElectionResponse>('/', toCreateElectionPayload(dto));
    return mapElection(response);
  }

  async updateElection(id: number, dto: ElectionUpdateRequestDto): Promise<Election> {
    const response = await this.put<ElectionResponse>(`/${id}`, toUpdateElectionPayload(dto));
    return mapElection(response);
  }

  async deleteElection(id: number): Promise<void> {
    await this.delete<void>(`/${id}`);
  }

  async addPosition(electionId: number, dto: PositionCreateRequestDto): Promise<ElectionPosition> {
    const response = await this.post<PositionResponse>(`/${electionId}/positions`, toPositionPayload(dto));
    return mapPosition(response);
  }

  async getPositions(electionId: number): Promise<ElectionPosition[]> {
    const response = await this.get<PositionResponse[]>(`/${electionId}/positions`);
    return response.map(mapPosition);
  }

  async addCandidate(positionId: number, dto: CandidateCreateRequestDto): Promise<Candidate> {
    const response = await this.post<CandidateResponse>(`/${positionId}/candidates`, toCandidatePayload(dto));
    return mapCandidate(response);
  }

  async getCandidates(positionId: number): Promise<Candidate[]> {
    const response = await this.get<CandidateResponse[]>(`/${positionId}/candidates`);
    return response.map(mapCandidate);
  }

  async castVote(electionId: number, dto: VoteRequestDto): Promise<{ message: string }> {
    return this.post<{ message: string }>(`/${electionId}/vote`, toVotePayload(dto));
  }

  async getResults(electionId: number): Promise<ElectionResult> {
    const response = await this.get<ElectionResultResponse>(`/${electionId}/results`);
    return mapResult(response);
  }

  async getVotingLogs(electionId: number, limit: number = 200): Promise<VotingLogEntry[]> {
    const response = await this.get<VotingLogResponse[]>(`/${electionId}/logs?limit=${limit}`);
    return response.map(mapVotingLog);
  }
}
