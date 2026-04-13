export enum UserRole {
  SUPER_ADMIN = 'superadmin',
  ADMIN = 'admin',
  ALUMNI = 'alumni',
  EVENT_MANAGER = 'event_manager',
  ELECTION_MANAGER = 'election_manager',
  MANAGER = 'manager',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  permissions: string[];
  createdAt: string;
  lastLogin?: string;
}
