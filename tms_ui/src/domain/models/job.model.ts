export interface JobListItem {
  id: number;
  title: string;
  company: string;
  location?: string;
  jobType: string;
  experienceLevel?: string;
  postedDate: string;
  expiresAt: string;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  company: string;
  location?: string;
  jobType: string;
  requiredSkills?: string;
  experienceLevel?: string;
  experienceYears?: number;
  applyLink: string;
  applyInternally: boolean;
  postedDate: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  id: number;
  jobId: number;
  userId: number;
  resumeUrl?: string;
  coverLetter?: string;
  status: string;
  appliedAt: string;
  updatedAt: string;
}
