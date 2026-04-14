export interface GetEventsRequestDto {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface EventCreateRequestDto {
  title: string;
  description: string;
  eventType?: string;
  startDate: string;
  endDate: string;
  location?: string;
  isOnline?: boolean;
  meetingLink?: string;
  isPaid?: boolean;
  fee?: number;
  currency?: string;
  maxCapacity?: number;
  organizedBy?: string;
}

export interface EventUpdateRequestDto {
  title?: string;
  description?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  isOnline?: boolean;
  meetingLink?: string;
  isPaid?: boolean;
  fee?: number;
  maxCapacity?: number;
  organizedBy?: string;
  isPublished?: boolean;
}

export interface EventPaymentCreateRequestDto {
  amount: number;
  currency?: string;
  status?: string;
  paymentMethod?: string;
  transactionId?: string;
}
