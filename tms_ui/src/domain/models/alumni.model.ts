export interface AlumniListItem {
  id: number;
  name: string;
  batch: string;
  department: string;
  profession?: string;
  company?: string;
  country?: string;
  profilePhoto?: string;
}

export interface Alumni {
  id: number;
  userId: number;
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
  profilePhoto?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  receiveEmails: boolean;
  receiveEventNotifications: boolean;
  createdAt: string;
  updatedAt: string;
}
