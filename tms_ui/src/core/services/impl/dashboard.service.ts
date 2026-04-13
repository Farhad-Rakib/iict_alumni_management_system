import { BaseRepository } from '../../api/base.repository';
import { GetDashboardResponseDto } from '../../../domain/dto/dashboard.dto';
import { IDashboardService } from '../dashboard.service.interface';

interface PaginatedItems {
  total: number;
}

const now = new Date();

const monthKey = (offset: number) => {
  const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  return d.toLocaleString('en-US', { month: 'short' });
};

export class DashboardService extends BaseRepository implements IDashboardService {
  constructor() {
    super('');
  }

  async getDashboardData(): Promise<GetDashboardResponseDto> {
    const [events, jobs, notices, alumni] = await Promise.all([
      this.get<PaginatedItems>('/events/', { params: { skip: 0, limit: 1 } }),
      this.get<PaginatedItems>('/jobs/', { params: { skip: 0, limit: 1 } }),
      this.get<PaginatedItems>('/notices/', { params: { skip: 0, limit: 1 } }),
      this.get<PaginatedItems>('/alumni/directory', { params: { skip: 0, limit: 1 } }),
    ]);

    const totalContent = (events.total || 0) + (jobs.total || 0) + (notices.total || 0);

    return {
      stats: [
        {
          id: 'alumni',
          title: 'Alumni',
          value: alumni.total || 0,
          change: 0,
          changeType: 'increase',
          icon: 'Users',
          color: 'blue',
        },
        {
          id: 'events',
          title: 'Events',
          value: events.total || 0,
          change: 0,
          changeType: 'increase',
          icon: 'Calendar',
          color: 'green',
        },
        {
          id: 'jobs',
          title: 'Jobs',
          value: jobs.total || 0,
          change: 0,
          changeType: 'increase',
          icon: 'Briefcase',
          color: 'amber',
        },
        {
          id: 'notices',
          title: 'Notices',
          value: notices.total || 0,
          change: 0,
          changeType: 'increase',
          icon: 'Bell',
          color: 'rose',
        },
      ],
      chartData: {
        revenue: Array.from({ length: 6 }).map((_, i) => ({
          name: monthKey(5 - i),
          value: Math.max(100, Math.round((totalContent || 1) * (0.5 + i * 0.2) * 100)),
        })),
        users: Array.from({ length: 6 }).map((_, i) => ({
          name: monthKey(5 - i),
          value: Math.max(1, Math.round((alumni.total || 1) * (0.4 + i * 0.15))),
        })),
        orders: Array.from({ length: 6 }).map((_, i) => ({
          name: monthKey(5 - i),
          value: Math.max(1, Math.round((jobs.total || 1) * (0.4 + i * 0.12))),
        })),
      },
      recentActivity: [
        {
          id: '1',
          user: 'System',
          action: `loaded ${alumni.total || 0} alumni records`,
          timestamp: new Date().toISOString(),
          type: 'info',
        },
        {
          id: '2',
          user: 'System',
          action: `loaded ${events.total || 0} events`,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: 'success',
        },
        {
          id: '3',
          user: 'System',
          action: `loaded ${jobs.total || 0} jobs`,
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          type: 'warning',
        },
      ],
    };
  }
}
