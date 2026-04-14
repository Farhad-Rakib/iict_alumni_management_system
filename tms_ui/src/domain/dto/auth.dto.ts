import { User } from '../models/user.model';

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface SendOtpRequestDto {
  email: string;
}

export interface SendOtpResponseDto {
  message: string;
  email: string;
}

export interface VerifyOtpRequestDto {
  email: string;
  otp: string;
}

export interface VerifyOtpResponseDto {
  message: string;
  verification_token: string;
  set_password_url?: string;
}

export interface SetPasswordRequestDto {
  email: string;
  verification_token: string;
  password: string;
  password_confirm: string;
}

export interface MessageResponseDto {
  message: string;
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
