import { PaginatedResponse } from '../api/http.types';
import { Alumni, AlumniListItem } from '../../domain/models/alumni.model';
import { AlumniCreateRequestDto, AlumniUpdateRequestDto, GetAlumniRequestDto } from '../../domain/dto/alumni.dto';

export interface IAlumniService {
  getAlumni(dto?: GetAlumniRequestDto): Promise<PaginatedResponse<AlumniListItem>>;
  getAlumniById(id: number): Promise<Alumni>;
  createAlumni(dto: AlumniCreateRequestDto): Promise<Alumni>;
  updateAlumni(id: number, dto: AlumniUpdateRequestDto): Promise<Alumni>;
  deleteAlumni(id: number): Promise<void>;
}
