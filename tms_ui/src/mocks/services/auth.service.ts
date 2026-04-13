import { IAuthService } from '../../core/services/auth.service.interface';
import { LoginRequestDto, LoginResponseDto } from '../../domain/dto/auth.dto';
import { User } from '../../domain/models/user.model';
import usersData from '../data/users.json';
import { mockResponse } from './mock.utils';

interface MockUserData extends Omit<User, 'role' | 'status'> {
  password: string;
  role: string;
  status: string;
}

const generateToken = (userId: string): string => {
  return `mock_token_${userId}_${Date.now()}`;
};

export class MockAuthService implements IAuthService {
  async login(dto: LoginRequestDto): Promise<LoginResponseDto> {
    const user = (usersData as MockUserData[]).find(
      u => u.email === dto.email && u.password === dto.password
    );

    if (!user) {
      return mockResponse(
        {} as LoginResponseDto,
        { error: true, errorMessage: 'Invalid email or password' }
      );
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(user.id);

    return mockResponse({
      user: userWithoutPassword as unknown as User,
      token,
    });
  }

  async logout(): Promise<void> {
    return mockResponse(undefined);
  }

  async verifyToken(token: string): Promise<boolean> {
    return mockResponse(token.startsWith('mock_token_'));
  }

  async refreshToken(token: string): Promise<string> {
    const parts = token.split('_');
    if (parts.length >= 3) {
      const userId = parts[2];
      return mockResponse(generateToken(userId));
    }
    return mockResponse(
      '',
      { error: true, errorMessage: 'Invalid token' }
    );
  }
}
