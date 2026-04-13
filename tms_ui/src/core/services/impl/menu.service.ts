import { BaseRepository } from '../../api/base.repository';
import { GetMenuResponseDto } from '../../../domain/dto/menu.dto';
import { IMenuService } from '../menu.service.interface';

export class MenuService extends BaseRepository implements IMenuService {
  constructor() {
    super('/menu');
  }

  async getMenuItems(): Promise<GetMenuResponseDto> {
    return this.get<GetMenuResponseDto>('');
  }
}
