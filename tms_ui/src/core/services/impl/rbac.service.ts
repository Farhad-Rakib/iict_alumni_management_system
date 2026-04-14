import { BaseRepository } from '../../api/base.repository';
import {
  CreatePermissionRequest,
  CreateRbacUserRequest,
  CreateRoleRequest,
  EndpointPermission,
  RbacPermission,
  RbacRole,
  RbacUser,
  UserAssignments,
  PermissionSyncResponse,
} from '../../../domain/models/rbac.model';
import { IRbacService } from '../rbac.service.interface';

export class RbacService extends BaseRepository implements IRbacService {
  constructor() {
    super('/rbac');
  }

  async getPermissions(): Promise<RbacPermission[]> {
    return this.get<RbacPermission[]>('/permissions');
  }

  async getEndpointPermissions(): Promise<EndpointPermission[]> {
    return this.get<EndpointPermission[]>('/permissions/endpoints');
  }

  async createPermission(dto: CreatePermissionRequest): Promise<RbacPermission> {
    return this.post<RbacPermission>('/permissions', dto);
  }

  async syncPermissions(): Promise<PermissionSyncResponse> {
    return this.post<PermissionSyncResponse>('/permissions/sync');
  }

  async getRoles(): Promise<RbacRole[]> {
    return this.get<RbacRole[]>('/roles');
  }

  async createRole(dto: CreateRoleRequest): Promise<RbacRole> {
    return this.post<RbacRole>('/roles', dto);
  }

  async updateRolePermissions(roleId: number, permissionIds: number[]): Promise<RbacRole> {
    return this.put<RbacRole>(`/roles/${roleId}/permissions`, { permission_ids: permissionIds });
  }

  async getUsers(): Promise<RbacUser[]> {
    return this.get<RbacUser[]>('/users');
  }

  async createUser(dto: CreateRbacUserRequest): Promise<RbacUser> {
    return this.post<RbacUser>('/users', dto);
  }

  async getUserAssignments(userId: number): Promise<UserAssignments> {
    return this.get<UserAssignments>(`/users/${userId}/assignments`);
  }

  async updateUserRoles(userId: number, roleIds: number[]): Promise<UserAssignments> {
    return this.put<UserAssignments>(`/users/${userId}/roles`, { role_ids: roleIds });
  }

  async updateUserPermissions(userId: number, permissionIds: number[]): Promise<UserAssignments> {
    return this.put<UserAssignments>(`/users/${userId}/permissions`, { permission_ids: permissionIds });
  }
}
