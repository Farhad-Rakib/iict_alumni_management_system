import { UserRole, UserStatus } from '../models/user.model';

export interface GetUsersRequestDto {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: UserStatus;
  role?: UserRole;
}

export interface CreateUserRequestDto {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  permissions: string[];
}

export interface UpdateUserRequestDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  role?: UserRole;
  status?: UserStatus;
  avatar?: string;
  permissions?: string[];
}
