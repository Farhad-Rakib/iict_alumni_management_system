import {
  Election,
  ElectionListItem,
  ElectionPosition,
  Candidate,
  ElectionResult,
  VotingLogEntry,
} from '../../domain/models/election.model';
import {
  ElectionCreateRequestDto,
  ElectionUpdateRequestDto,
  PositionCreateRequestDto,
  CandidateCreateRequestDto,
  VoteRequestDto,
} from '../../domain/dto/election.dto';

export interface IElectionService {
  getElections(): Promise<ElectionListItem[]>;
  getElectionById(id: number): Promise<Election>;
  createElection(dto: ElectionCreateRequestDto): Promise<Election>;
  updateElection(id: number, dto: ElectionUpdateRequestDto): Promise<Election>;
  deleteElection(id: number): Promise<void>;
  addPosition(electionId: number, dto: PositionCreateRequestDto): Promise<ElectionPosition>;
  getPositions(electionId: number): Promise<ElectionPosition[]>;
  addCandidate(positionId: number, dto: CandidateCreateRequestDto): Promise<Candidate>;
  getCandidates(positionId: number): Promise<Candidate[]>;
  castVote(electionId: number, dto: VoteRequestDto): Promise<{ message: string }>;
  getResults(electionId: number): Promise<ElectionResult>;
  getVotingLogs(electionId: number, limit?: number): Promise<VotingLogEntry[]>;
}
