export interface ElectionListItem {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  votingStart: string;
  votingEnd: string;
  isPublished: boolean;
  isActive: boolean;
}

export interface Election extends ElectionListItem {
  description?: string;
  createdAt: string;
}

export interface ElectionPosition {
  id: number;
  electionId: number;
  name: string;
  description?: string;
  maxVotes: number;
}

export interface Candidate {
  id: number;
  positionId: number;
  userId: number;
  name: string;
  bio?: string;
  photoUrl?: string;
  manifesto?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ElectionCandidateResult {
  candidateId: number;
  candidateName: string;
  votes: number;
  percentage: number;
}

export interface ElectionPositionResult {
  positionId: number;
  positionName: string;
  candidates: ElectionCandidateResult[];
}

export interface ElectionResult {
  electionId: number;
  electionTitle: string;
  totalVotes: number;
  positions: ElectionPositionResult[];
  createdAt: string;
}

export interface VotingLogEntry {
  id: number;
  electionId: number;
  userId: number;
  userEmail?: string;
  action: string;
  ipAddress?: string;
  reason?: string;
  createdAt: string;
}