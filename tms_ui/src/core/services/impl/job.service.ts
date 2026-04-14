import { BaseRepository } from '../../api/base.repository';
import { PaginatedResponse } from '../../api/http.types';
import { Job, JobListItem } from '../../../domain/models/job.model';
import { GetJobsRequestDto, JobCreateRequestDto, JobUpdateRequestDto } from '../../../domain/dto/job.dto';
import { IJobService } from '../job.service.interface';

interface JobListItemResponse {
  id: number;
  title: string;
  company: string;
  location?: string | null;
  job_type: string;
  experience_level?: string | null;
  posted_date: string;
  expires_at: string;
}

interface JobResponse {
  id: number;
  title: string;
  description: string;
  company: string;
  location?: string | null;
  job_type: string;
  required_skills?: string | null;
  experience_level?: string | null;
  experience_years?: number | null;
  apply_link: string;
  apply_internally: boolean;
  posted_date: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginatedJobResponse {
  items: JobListItemResponse[];
  total: number;
  skip: number;
  limit: number;
  page: number;
  pages: number;
}

const mapListItem = (item: JobListItemResponse): JobListItem => ({
  id: item.id,
  title: item.title,
  company: item.company,
  location: item.location || undefined,
  jobType: item.job_type,
  experienceLevel: item.experience_level || undefined,
  postedDate: item.posted_date,
  expiresAt: item.expires_at,
});

const mapJob = (item: JobResponse): Job => ({
  id: item.id,
  title: item.title,
  description: item.description,
  company: item.company,
  location: item.location || undefined,
  jobType: item.job_type,
  requiredSkills: item.required_skills || undefined,
  experienceLevel: item.experience_level || undefined,
  experienceYears: item.experience_years ?? undefined,
  applyLink: item.apply_link,
  applyInternally: item.apply_internally,
  postedDate: item.posted_date,
  expiresAt: item.expires_at,
  isActive: item.is_active,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const toCreatePayload = (dto: JobCreateRequestDto) => ({
  title: dto.title,
  description: dto.description,
  company: dto.company,
  location: dto.location,
  job_type: dto.jobType,
  required_skills: dto.requiredSkills,
  experience_level: dto.experienceLevel,
  experience_years: dto.experienceYears,
  apply_link: dto.applyLink,
  apply_internally: dto.applyInternally ?? false,
  expires_at: dto.expiresAt,
});

const toUpdatePayload = (dto: JobUpdateRequestDto) => ({
  title: dto.title,
  description: dto.description,
  company: dto.company,
  location: dto.location,
  job_type: dto.jobType,
  required_skills: dto.requiredSkills,
  experience_level: dto.experienceLevel,
  experience_years: dto.experienceYears,
  apply_link: dto.applyLink,
  apply_internally: dto.applyInternally,
  expires_at: dto.expiresAt,
  is_active: dto.isActive,
});

export class JobService extends BaseRepository implements IJobService {
  constructor() {
    super('/jobs');
  }

  async getJobs(dto?: GetJobsRequestDto): Promise<PaginatedResponse<JobListItem>> {
    const page = dto?.page || 1;
    const pageSize = dto?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const response = await this.get<PaginatedJobResponse>('/', {
      params: { skip, limit: pageSize },
    });

    const mapped = response.items.map(mapListItem).filter((item) => {
      if (!dto?.search) return true;
      const q = dto.search.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.company.toLowerCase().includes(q);
    });

    return {
      data: mapped,
      total: response.total,
      page: response.page,
      pageSize: response.limit,
      totalPages: response.pages,
    };
  }

  async getJobById(id: number): Promise<Job> {
    const response = await this.get<JobResponse>(`/${id}`);
    return mapJob(response);
  }

  async createJob(dto: JobCreateRequestDto): Promise<Job> {
    const response = await this.post<JobResponse>('/', toCreatePayload(dto));
    return mapJob(response);
  }

  async updateJob(id: number, dto: JobUpdateRequestDto): Promise<Job> {
    const response = await this.put<JobResponse>(`/${id}`, toUpdatePayload(dto));
    return mapJob(response);
  }

  async deleteJob(id: number): Promise<void> {
    await this.delete<void>(`/${id}`);
  }
}
