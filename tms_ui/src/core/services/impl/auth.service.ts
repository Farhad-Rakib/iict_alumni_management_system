import { BaseRepository } from '../../api/base.repository';
import { LoginRequestDto, LoginResponseDto } from '../../../domain/dto/auth.dto';
import { User, UserRole, UserStatus } from '../../../domain/models/user.model';
import { IAuthService } from '../auth.service.interface';
import { getPermissionsForRole } from '../../auth/rbac';

interface BackendTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface BackendCurrentUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  permissions?: string[];
  is_active: boolean;
  last_login?: string | null;
  created_at: string;
}

const toUserRole = (role: string): UserRole => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return UserRole.SUPER_ADMIN;
    case UserRole.ADMIN:
      return UserRole.ADMIN;
    case UserRole.ALUMNI:
      return UserRole.ALUMNI;
    case UserRole.EVENT_MANAGER:
      return UserRole.EVENT_MANAGER;
    case UserRole.ELECTION_MANAGER:
      return UserRole.ELECTION_MANAGER;
    default:
      return UserRole.USER;
  }
};

const mapBackendUser = (u: BackendCurrentUser): User => {
  const role = toUserRole(u.role);
  const [firstName = '', ...rest] = (u.full_name || '').trim().split(' ');
  const lastName = rest.join(' ');

  return {
    id: String(u.id),
    email: u.email,
    firstName: firstName || u.email.split('@')[0],
    lastName,
    fullName: u.full_name,
    role,
    status: u.is_active ? UserStatus.ACTIVE : UserStatus.INACTIVE,
    permissions: u.permissions?.length ? u.permissions : getPermissionsForRole(role),
    createdAt: u.created_at,
    lastLogin: u.last_login || undefined,
  };
};

export class AuthService extends BaseRepository implements IAuthService {
  constructor() {
    super('/auth');
  }

  async login(dto: LoginRequestDto): Promise<LoginResponseDto> {
    const tokenData = await this.post<BackendTokenResponse>('/login', dto);
    const me = await this.get<BackendCurrentUser>('/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    return {
      user: mapBackendUser(me),
      token: tokenData.access_token,
    };
  }

  async logout(): Promise<void> {
    return;
  }

  async verifyToken(token: string): Promise<boolean> {
    try {
      await this.get<BackendCurrentUser>('/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  async refreshToken(token: string): Promise<string> {
    const refreshed = await this.post<BackendTokenResponse>('/refresh', {
      refresh_token: token,
    });
    return refreshed.access_token;
  }
}
