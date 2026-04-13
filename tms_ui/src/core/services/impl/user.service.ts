import { BaseRepository } from '../../api/base.repository';
import { PaginatedResponse } from '../../api/http.types';
import { User } from '../../../domain/models/user.model';
import { UserRole, UserStatus } from '../../../domain/models/user.model';
import { GetUsersRequestDto, CreateUserRequestDto, UpdateUserRequestDto } from '../../../domain/dto/user.dto';
import { IUserService } from '../user.service.interface';

interface AlumniListItem {
  id: number;
  name: string;
  profession?: string;
  company?: string;
}

interface AlumniDirectoryResponse {
  items: AlumniListItem[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

interface AlumniDetail {
  id: number;
  name: string;
  email: string;
  profession?: string;
  company?: string;
  created_at: string;
}

const toUser = (item: AlumniListItem | AlumniDetail): User => {
  const [firstName = '', ...rest] = (item.name || '').split(' ');
  const lastName = rest.join(' ');
  const email = (item as AlumniDetail).email || `${String(item.id)}@alumni.local`;

  return {
    id: String(item.id),
    email,
    firstName: firstName || 'Alumni',
    lastName,
    fullName: item.name,
    role: UserRole.ALUMNI,
    status: UserStatus.ACTIVE,
    permissions: ['dashboard.view', 'reports.view'],
    createdAt: (item as AlumniDetail).created_at || new Date().toISOString(),
  };
};

export class UserService extends BaseRepository implements IUserService {
  constructor() {
    super('/alumni');
  }

  async getUsers(dto?: GetUsersRequestDto): Promise<PaginatedResponse<User>> {
    const page = dto?.page || 1;
    const pageSize = dto?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const response = await this.get<AlumniDirectoryResponse>('/directory', {
      params: {
        skip,
        limit: pageSize,
      },
    });

    const mapped = response.items.map(toUser).filter((u) => {
      if (!dto?.search) return true;
      const q = dto.search.toLowerCase();
      return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });

    return {
      data: mapped,
      total: response.total,
      page: response.page,
      pageSize: response.limit,
      totalPages: response.pages,
    };
  }

  async getUserById(id: string): Promise<User | undefined> {
    const response = await this.get<AlumniDetail>(`/${id}`);
    return toUser(response);
  }

  async createUser(dto: CreateUserRequestDto): Promise<User> {
    const payload = {
      name: dto.fullName,
      batch: 'N/A',
      department: 'General',
      email: dto.email,
      profession: dto.role,
    };

    await this.post('/create', payload);

    const list = await this.getUsers({ page: 1, pageSize: 1 });
    return list.data[0];
  }

  async updateUser(id: string, dto: UpdateUserRequestDto): Promise<User> {
    await this.put(`/${id}`, {
      name: dto.fullName,
      profession: dto.role,
    });
    const updated = await this.getUserById(id);
    if (!updated) {
      throw new Error('User not found');
    }
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    return this.delete<void>(`/${id}`);
  }
}
