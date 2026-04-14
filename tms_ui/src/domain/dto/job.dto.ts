export interface GetJobsRequestDto {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface JobCreateRequestDto {
  title: string;
  description: string;
  company: string;
  location?: string;
  jobType: string;
  requiredSkills?: string;
  experienceLevel?: string;
  experienceYears?: number;
  applyLink: string;
  applyInternally?: boolean;
  expiresAt: string;
}

export interface JobUpdateRequestDto {
  title?: string;
  description?: string;
  company?: string;
  location?: string;
  jobType?: string;
  requiredSkills?: string;
  experienceLevel?: string;
  experienceYears?: number;
  applyLink?: string;
  applyInternally?: boolean;
  expiresAt?: string;
  isActive?: boolean;
}
