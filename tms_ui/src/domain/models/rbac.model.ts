import { UserRole } from './user.model';

export interface RbacPermission {
  id: number;
  name: string;
  description?: string;
  resource: string;
  action: string;
  endpoint_count: number;
}

export interface EndpointPermission {
  id: number;
  route_path: string;
  http_method: string;
  route_name?: string;
  resource: string;
  action: string;
  permission_name: string;
  permission_id?: number;
  source: 'auto' | 'declared' | string;
  is_active: boolean;
  last_synced_at: string;
}

export interface RbacRole {
  id: number;
  name: string;
  description?: string;
  is_system: boolean;
  permissions: string[];
  permission_ids: number[];
  created_at: string;
}

export interface RbacUser {
  id: number;
  email: string;
  full_name: string;
  base_role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  roles: string[];
  role_ids: number[];
  direct_permissions: string[];
  direct_permission_ids: number[];
}

export interface UserAssignments {
  user_id: number;
  role_ids: number[];
  permission_ids: number[];
  roles: string[];
  direct_permissions: string[];
  effective_permissions: string[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permission_ids: number[];
}

export interface CreatePermissionRequest {
  name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface CreateRbacUserRequest {
  email: string;
  full_name: string;
  password: string;
  base_role: UserRole;
  role_ids: number[];
  permission_ids: number[];
}

export interface PermissionSyncResponse {
  discovered_permissions: string[];
  created_permissions: string[];
  existing_permissions: string[];
  discovered_count: number;
  created_count: number;
  existing_count: number;
  endpoint_count: number;
}
