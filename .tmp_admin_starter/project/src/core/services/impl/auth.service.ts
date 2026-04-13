import { BaseRepository } from '../../api/base.repository';
import { LoginRequestDto, LoginResponseDto } from '../../../domain/dto/auth.dto';
import { IAuthService } from '../auth.service.interface';

export class AuthService extends BaseRepository implements IAuthService {
  constructor() {
    super('/auth');
  }

  async login(dto: LoginRequestDto): Promise<LoginResponseDto> {
    return this.post<LoginResponseDto>('/login', dto);
  }

  async logout(): Promise<void> {
    return this.post<void>('/logout');
  }

  async verifyToken(token: string): Promise<boolean> {
    return this.post<boolean>('/verify', { token });
  }

  async refreshToken(token: string): Promise<string> {
    return this.post<string>('/refresh', { token });
  }
}
