import {
  LoginRequestDto,
  LoginResponseDto,
  SendOtpRequestDto,
  SendOtpResponseDto,
  VerifyOtpRequestDto,
  VerifyOtpResponseDto,
  SetPasswordRequestDto,
  MessageResponseDto,
} from '../../domain/dto/auth.dto';

export interface IAuthService {
  login(dto: LoginRequestDto): Promise<LoginResponseDto>;
  sendOtp(dto: SendOtpRequestDto): Promise<SendOtpResponseDto>;
  verifyOtp(dto: VerifyOtpRequestDto): Promise<VerifyOtpResponseDto>;
  setPassword(dto: SetPasswordRequestDto): Promise<MessageResponseDto>;
  logout(): Promise<void>;
  verifyToken(token: string): Promise<boolean>;
  refreshToken(token: string): Promise<string>;
}
