import { PaginatedResponse } from '../api/http.types';
import { Job, JobListItem } from '../../domain/models/job.model';
import { GetJobsRequestDto, JobCreateRequestDto, JobUpdateRequestDto } from '../../domain/dto/job.dto';

export interface IJobService {
  getJobs(dto?: GetJobsRequestDto): Promise<PaginatedResponse<JobListItem>>;
  getJobById(id: number): Promise<Job>;
  createJob(dto: JobCreateRequestDto): Promise<Job>;
  updateJob(id: number, dto: JobUpdateRequestDto): Promise<Job>;
  deleteJob(id: number): Promise<void>;
}
