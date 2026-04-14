export interface GetAlumniRequestDto {
  page?: number;
  pageSize?: number;
  search?: string;
  batch?: string;
  department?: string;
  profession?: string;
  country?: string;
  company?: string;
}

export interface AlumniCreateRequestDto {
  name: string;
  batch: string;
  department: string;
  rollNumber?: string;
  email: string;
  phone?: string;
  profession?: string;
  company?: string;
  country?: string;
  city?: string;
  bio?: string;
  skills?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface AlumniUpdateRequestDto {
  name?: string;
  profession?: string;
  company?: string;
  country?: string;
  city?: string;
  bio?: string;
  skills?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  receiveEmails?: boolean;
  receiveEventNotifications?: boolean;
}
