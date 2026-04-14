import { BaseRepository } from '../../api/base.repository';
import { PaginatedResponse } from '../../api/http.types';
import { Alumni, AlumniListItem } from '../../../domain/models/alumni.model';
import { AlumniCreateRequestDto, AlumniUpdateRequestDto, GetAlumniRequestDto } from '../../../domain/dto/alumni.dto';
import { IAlumniService } from '../alumni.service.interface';

interface AlumniListItemResponse {
  id: number;
  name: string;
  batch: string;
  department: string;
  profession?: string | null;
  company?: string | null;
  country?: string | null;
  profile_photo?: string | null;
}

interface AlumniResponse {
  id: number;
  user_id: number;
  name: string;
  batch: string;
  department: string;
  roll_number?: string | null;
  email: string;
  phone?: string | null;
  profession?: string | null;
  company?: string | null;
  country?: string | null;
  city?: string | null;
  bio?: string | null;
  skills?: string | null;
  profile_photo?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  receive_emails: boolean;
  receive_event_notifications: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginatedAlumniResponse {
  items: AlumniListItemResponse[];
  total: number;
  skip: number;
  limit: number;
  page: number;
  pages: number;
}

const mapListItem = (item: AlumniListItemResponse): AlumniListItem => ({
  id: item.id,
  name: item.name,
  batch: item.batch,
  department: item.department,
  profession: item.profession || undefined,
  company: item.company || undefined,
  country: item.country || undefined,
  profilePhoto: item.profile_photo || undefined,
});

const mapAlumni = (item: AlumniResponse): Alumni => ({
  id: item.id,
  userId: item.user_id,
  name: item.name,
  batch: item.batch,
  department: item.department,
  rollNumber: item.roll_number || undefined,
  email: item.email,
  phone: item.phone || undefined,
  profession: item.profession || undefined,
  company: item.company || undefined,
  country: item.country || undefined,
  city: item.city || undefined,
  bio: item.bio || undefined,
  skills: item.skills || undefined,
  profilePhoto: item.profile_photo || undefined,
  linkedinUrl: item.linkedin_url || undefined,
  githubUrl: item.github_url || undefined,
  portfolioUrl: item.portfolio_url || undefined,
  receiveEmails: item.receive_emails,
  receiveEventNotifications: item.receive_event_notifications,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const toCreatePayload = (dto: AlumniCreateRequestDto) => ({
  name: dto.name,
  batch: dto.batch,
  department: dto.department,
  roll_number: dto.rollNumber,
  email: dto.email,
  phone: dto.phone,
  profession: dto.profession,
  company: dto.company,
  country: dto.country,
  city: dto.city,
  bio: dto.bio,
  skills: dto.skills,
  linkedin_url: dto.linkedinUrl,
  github_url: dto.githubUrl,
  portfolio_url: dto.portfolioUrl,
});

const toUpdatePayload = (dto: AlumniUpdateRequestDto) => ({
  name: dto.name,
  profession: dto.profession,
  company: dto.company,
  country: dto.country,
  city: dto.city,
  bio: dto.bio,
  skills: dto.skills,
  linkedin_url: dto.linkedinUrl,
  github_url: dto.githubUrl,
  portfolio_url: dto.portfolioUrl,
  receive_emails: dto.receiveEmails,
  receive_event_notifications: dto.receiveEventNotifications,
});

export class AlumniService extends BaseRepository implements IAlumniService {
  constructor() {
    super('/alumni');
  }

  async getAlumni(dto?: GetAlumniRequestDto): Promise<PaginatedResponse<AlumniListItem>> {
    const page = dto?.page || 1;
    const pageSize = dto?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const response = await this.get<PaginatedAlumniResponse>('/directory', {
      params: {
        skip,
        limit: pageSize,
        batch: dto?.batch,
        department: dto?.department,
        profession: dto?.profession,
        country: dto?.country,
        company: dto?.company,
      },
    });

    const mapped = response.items.map(mapListItem).filter((item) => {
      if (!dto?.search) return true;
      const q = dto.search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        item.batch.toLowerCase().includes(q)
      );
    });

    return {
      data: mapped,
      total: response.total,
      page: response.page,
      pageSize: response.limit,
      totalPages: response.pages,
    };
  }

  async getAlumniById(id: number): Promise<Alumni> {
    const response = await this.get<AlumniResponse>(`/${id}`);
    return mapAlumni(response);
  }

  async createAlumni(dto: AlumniCreateRequestDto): Promise<Alumni> {
    const payload = toCreatePayload(dto);
    const response = await this.post<{ alumni_id: number }>('/create', payload);
    return this.getAlumniById(response.alumni_id);
  }

  async updateAlumni(id: number, dto: AlumniUpdateRequestDto): Promise<Alumni> {
    const response = await this.put<AlumniResponse>(`/${id}`, toUpdatePayload(dto));
    return mapAlumni(response);
  }

  async deleteAlumni(id: number): Promise<void> {
    await this.delete<void>(`/${id}`);
  }
}
