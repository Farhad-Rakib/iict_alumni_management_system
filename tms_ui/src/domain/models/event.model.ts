export interface EventListItem {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  isPaid: boolean;
  fee: number;
  maxCapacity?: number;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  eventType?: string;
  startDate: string;
  endDate: string;
  location?: string;
  isOnline: boolean;
  meetingLink?: string;
  isPaid: boolean;
  fee: number;
  currency: string;
  maxCapacity?: number;
  isPublished: boolean;
  organizedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventRSVP {
  id: number;
  eventId: number;
  userId: number;
  status: string;
  registrationDate: string;
}

export interface EventPayment {
  id: number;
  eventId: number;
  userId: number;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
}
