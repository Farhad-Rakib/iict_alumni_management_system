import { IUserService } from '../../core/services/user.service.interface';
import { PaginatedResponse } from '../../core/api/http.types';
import { User } from '../../domain/models/user.model';
import { GetUsersRequestDto, CreateUserRequestDto, UpdateUserRequestDto } from '../../domain/dto/user.dto';
import usersData from '../data/users.json';
import { mockResponse, paginate, searchData, sortData } from './mock.utils';

let users = [...usersData] as User[];

export class MockUserService implements IUserService {
  async getUsers(dto: GetUsersRequestDto = {}): Promise<PaginatedResponse<User>> {
    const {
      page = 1,
      pageSize = 10,
      search = '',
      sortBy,
      sortOrder = 'asc',
      status,
      role,
    } = dto;

    let filteredUsers = [...users];

    if (status) {
      filteredUsers = filteredUsers.filter(u => u.status === status);
    }

    if (role) {
      filteredUsers = filteredUsers.filter(u => u.role === role);
    }

    if (search) {
      filteredUsers = searchData(
        filteredUsers,
        search,
        ['firstName', 'lastName', 'email', 'fullName']
      );
    }

    if (sortBy) {
      filteredUsers = sortData(filteredUsers, sortBy, sortOrder);
    }

    return mockResponse(paginate(filteredUsers, page, pageSize));
  }

  async getUserById(id: string): Promise<User | undefined> {
    const user = users.find(u => u.id === id);
    if (!user) {
      return mockResponse(
        undefined,
        { error: true, errorMessage: 'User not found' }
      );
    }
    return mockResponse(user);
  }

  async createUser(dto: CreateUserRequestDto): Promise<User> {
    const newUser: User = {
      ...dto,
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
    };
    users = [...users, newUser];
    return mockResponse(newUser);
  }

  async updateUser(id: string, dto: UpdateUserRequestDto): Promise<User> {
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      return mockResponse(
        {} as User,
        { error: true, errorMessage: 'User not found' }
      );
    }

    const updatedUser = { ...users[index], ...dto };
    users = [...users.slice(0, index), updatedUser, ...users.slice(index + 1)];
    return mockResponse(updatedUser);
  }

  async deleteUser(id: string): Promise<void> {
    const index = users.findIndex(u => u.id === id);
    if (index === -1) {
      return mockResponse(
        undefined,
        { error: true, errorMessage: 'User not found' }
      );
    }

    users = [...users.slice(0, index), ...users.slice(index + 1)];
    return mockResponse(undefined);
  }
}
