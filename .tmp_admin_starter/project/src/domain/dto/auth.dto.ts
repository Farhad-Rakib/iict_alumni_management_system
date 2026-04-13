import { User } from '../models/user.model';

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  user: User;
  token: string;
}

export interface TokenVerifyResponseDto {
  valid: boolean;
}

export interface TokenRefreshResponseDto {
  token: string;
}
