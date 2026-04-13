import { IDashboardService } from '../../core/services/dashboard.service.interface';
import { GetDashboardResponseDto } from '../../domain/dto/dashboard.dto';
import dashboardData from '../data/dashboard.json';
import { mockResponse } from './mock.utils';

export class MockDashboardService implements IDashboardService {
  async getDashboardData(): Promise<GetDashboardResponseDto> {
    return mockResponse(dashboardData as GetDashboardResponseDto);
  }
}
