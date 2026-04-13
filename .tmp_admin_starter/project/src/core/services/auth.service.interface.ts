import { LoginRequestDto, LoginResponseDto } from '../../domain/dto/auth.dto';

export interface IAuthService {
  login(dto: LoginRequestDto): Promise<LoginResponseDto>;
  logout(): Promise<void>;
  verifyToken(token: string): Promise<boolean>;
  refreshToken(token: string): Promise<string>;
}
