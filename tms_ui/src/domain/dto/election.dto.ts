export interface ElectionCreateRequestDto {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  votingStart: string;
  votingEnd: string;
}

export interface ElectionUpdateRequestDto {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  votingStart?: string;
  votingEnd?: string;
  isPublished?: boolean;
  isActive?: boolean;
}

export interface PositionCreateRequestDto {
  name: string;
  description?: string;
  maxVotes?: number;
}

export interface CandidateCreateRequestDto {
  userId: number;
  name: string;
  bio?: string;
  manifesto?: string;
}

export interface VoteRequestDto {
  candidateId: number;
}