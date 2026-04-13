import {
  CreatePermissionRequest,
  CreateRbacUserRequest,
  CreateRoleRequest,
  RbacPermission,
  RbacRole,
  RbacUser,
  UserAssignments,
  PermissionSyncResponse,
} from '../../domain/models/rbac.model';

export interface IRbacService {
  getPermissions(): Promise<RbacPermission[]>;
  createPermission(dto: CreatePermissionRequest): Promise<RbacPermission>;
  syncPermissions(): Promise<PermissionSyncResponse>;
  getRoles(): Promise<RbacRole[]>;
  createRole(dto: CreateRoleRequest): Promise<RbacRole>;
  updateRolePermissions(roleId: number, permissionIds: number[]): Promise<RbacRole>;
  getUsers(): Promise<RbacUser[]>;
  createUser(dto: CreateRbacUserRequest): Promise<RbacUser>;
  getUserAssignments(userId: number): Promise<UserAssignments>;
  updateUserRoles(userId: number, roleIds: number[]): Promise<UserAssignments>;
  updateUserPermissions(userId: number, permissionIds: number[]): Promise<UserAssignments>;
}
