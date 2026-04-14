import { PaginatedResponse } from '../api/http.types';
import { Event, EventListItem, EventPayment } from '../../domain/models/event.model';
import { GetEventsRequestDto, EventCreateRequestDto, EventUpdateRequestDto, EventPaymentCreateRequestDto } from '../../domain/dto/event.dto';

export interface IEventService {
  getEvents(dto?: GetEventsRequestDto): Promise<PaginatedResponse<EventListItem>>;
  getEventById(id: number): Promise<Event>;
  createEvent(dto: EventCreateRequestDto): Promise<Event>;
  updateEvent(id: number, dto: EventUpdateRequestDto): Promise<Event>;
  deleteEvent(id: number): Promise<void>;
  getEventPayments(eventId: number): Promise<EventPayment[]>;
  createEventPayment(eventId: number, dto: EventPaymentCreateRequestDto): Promise<EventPayment>;
}
