import { IMenuService } from '../../core/services/menu.service.interface';
import { GetMenuResponseDto } from '../../domain/dto/menu.dto';
import menuData from '../data/menu.json';
import { mockResponse } from './mock.utils';

export class MockMenuService implements IMenuService {
  async getMenuItems(): Promise<GetMenuResponseDto> {
    return mockResponse(menuData as GetMenuResponseDto);
  }
}
