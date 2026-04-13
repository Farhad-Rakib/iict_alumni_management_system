import { BaseRepository } from '../../api/base.repository';
import { PaginatedResponse } from '../../api/http.types';
import { User } from '../../../domain/models/user.model';
import { GetUsersRequestDto, CreateUserRequestDto, UpdateUserRequestDto } from '../../../domain/dto/user.dto';
import { IUserService } from '../user.service.interface';

export class UserService extends BaseRepository implements IUserService {
  constructor() {
    super('/users');
  }

  async getUsers(dto?: GetUsersRequestDto): Promise<PaginatedResponse<User>> {
    return this.get<PaginatedResponse<User>>('', { params: dto });
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.get<User>(`/${id}`);
  }

  async createUser(dto: CreateUserRequestDto): Promise<User> {
    return this.post<User>('', dto);
  }

  async updateUser(id: string, dto: UpdateUserRequestDto): Promise<User> {
    return this.put<User>(`/${id}`, dto);
  }

  async deleteUser(id: string): Promise<void> {
    return this.delete<void>(`/${id}`);
  }
}
