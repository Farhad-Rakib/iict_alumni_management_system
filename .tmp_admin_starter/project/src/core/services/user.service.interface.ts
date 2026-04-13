import { PaginatedResponse } from '../api/http.types';
import { User } from '../../domain/models/user.model';
import { GetUsersRequestDto, CreateUserRequestDto, UpdateUserRequestDto } from '../../domain/dto/user.dto';

export interface IUserService {
  getUsers(dto?: GetUsersRequestDto): Promise<PaginatedResponse<User>>;
  getUserById(id: string): Promise<User | undefined>;
  createUser(dto: CreateUserRequestDto): Promise<User>;
  updateUser(id: string, dto: UpdateUserRequestDto): Promise<User>;
  deleteUser(id: string): Promise<void>;
}
