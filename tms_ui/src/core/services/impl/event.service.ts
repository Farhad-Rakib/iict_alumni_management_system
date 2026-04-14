import { BaseRepository } from '../../api/base.repository';
import { PaginatedResponse } from '../../api/http.types';
import { Event, EventListItem, EventPayment } from '../../../domain/models/event.model';
import { GetEventsRequestDto, EventCreateRequestDto, EventUpdateRequestDto, EventPaymentCreateRequestDto } from '../../../domain/dto/event.dto';
import { IEventService } from '../event.service.interface';

interface EventListItemResponse {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  location?: string | null;
  is_paid: boolean;
  fee: number;
  max_capacity?: number | null;
}

interface EventResponse {
  id: number;
  title: string;
  description: string;
  event_type?: string | null;
  start_date: string;
  end_date: string;
  location?: string | null;
  is_online: boolean;
  meeting_link?: string | null;
  is_paid: boolean;
  fee: number;
  currency: string;
  max_capacity?: number | null;
  is_published: boolean;
  organized_by?: string | null;
  created_at: string;
  updated_at: string;
}

interface PaginatedEventResponse {
  items: EventListItemResponse[];
  total: number;
  skip: number;
  limit: number;
  page: number;
  pages: number;
}

interface EventPaymentResponse {
  id: number;
  event_id: number;
  user_id: number;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string | null;
  transaction_id?: string | null;
  paid_at?: string | null;
  created_at: string;
}

const mapListItem = (item: EventListItemResponse): EventListItem => ({
  id: item.id,
  title: item.title,
  startDate: item.start_date,
  endDate: item.end_date,
  location: item.location || undefined,
  isPaid: item.is_paid,
  fee: item.fee,
  maxCapacity: item.max_capacity ?? undefined,
});

const mapEvent = (item: EventResponse): Event => ({
  id: item.id,
  title: item.title,
  description: item.description,
  eventType: item.event_type || undefined,
  startDate: item.start_date,
  endDate: item.end_date,
  location: item.location || undefined,
  isOnline: item.is_online,
  meetingLink: item.meeting_link || undefined,
  isPaid: item.is_paid,
  fee: item.fee,
  currency: item.currency,
  maxCapacity: item.max_capacity ?? undefined,
  isPublished: item.is_published,
  organizedBy: item.organized_by || undefined,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const mapPayment = (item: EventPaymentResponse): EventPayment => ({
  id: item.id,
  eventId: item.event_id,
  userId: item.user_id,
  amount: item.amount,
  currency: item.currency,
  status: item.status,
  paymentMethod: item.payment_method || undefined,
  transactionId: item.transaction_id || undefined,
  paidAt: item.paid_at || undefined,
  createdAt: item.created_at,
});

const toCreatePayload = (dto: EventCreateRequestDto) => ({
  title: dto.title,
  description: dto.description,
  event_type: dto.eventType,
  start_date: dto.startDate,
  end_date: dto.endDate,
  location: dto.location,
  is_online: dto.isOnline ?? false,
  meeting_link: dto.meetingLink,
  is_paid: dto.isPaid ?? false,
  fee: dto.fee ?? 0,
  currency: dto.currency || 'USD',
  max_capacity: dto.maxCapacity,
  organized_by: dto.organizedBy,
});

const toUpdatePayload = (dto: EventUpdateRequestDto) => ({
  title: dto.title,
  description: dto.description,
  event_type: dto.eventType,
  start_date: dto.startDate,
  end_date: dto.endDate,
  location: dto.location,
  is_online: dto.isOnline,
  meeting_link: dto.meetingLink,
  is_paid: dto.isPaid,
  fee: dto.fee,
  max_capacity: dto.maxCapacity,
  organized_by: dto.organizedBy,
  is_published: dto.isPublished,
});

const toPaymentPayload = (dto: EventPaymentCreateRequestDto) => ({
  amount: dto.amount,
  currency: dto.currency,
  status: dto.status,
  payment_method: dto.paymentMethod,
  transaction_id: dto.transactionId,
});

export class EventService extends BaseRepository implements IEventService {
  constructor() {
    super('/events');
  }

  async getEvents(dto?: GetEventsRequestDto): Promise<PaginatedResponse<EventListItem>> {
    const page = dto?.page || 1;
    const pageSize = dto?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const response = await this.get<PaginatedEventResponse>('/', {
      params: { skip, limit: pageSize },
    });

    const mapped = response.items.map(mapListItem).filter((item) => {
      if (!dto?.search) return true;
      const q = dto.search.toLowerCase();
      return item.title.toLowerCase().includes(q);
    });

    return {
      data: mapped,
      total: response.total,
      page: response.page,
      pageSize: response.limit,
      totalPages: response.pages,
    };
  }

  async getEventById(id: number): Promise<Event> {
    const response = await this.get<EventResponse>(`/${id}`);
    return mapEvent(response);
  }

  async createEvent(dto: EventCreateRequestDto): Promise<Event> {
    const response = await this.post<EventResponse>('/', toCreatePayload(dto));
    return mapEvent(response);
  }

  async updateEvent(id: number, dto: EventUpdateRequestDto): Promise<Event> {
    const response = await this.put<EventResponse>(`/${id}`, toUpdatePayload(dto));
    return mapEvent(response);
  }

  async deleteEvent(id: number): Promise<void> {
    await this.delete<void>(`/${id}`);
  }

  async getEventPayments(eventId: number): Promise<EventPayment[]> {
    const response = await this.get<EventPaymentResponse[]>(`/${eventId}/payments`);
    return response.map(mapPayment);
  }

  async createEventPayment(eventId: number, dto: EventPaymentCreateRequestDto): Promise<EventPayment> {
    const response = await this.post<EventPaymentResponse>(`/${eventId}/payments`, toPaymentPayload(dto));
    return mapPayment(response);
  }
}
