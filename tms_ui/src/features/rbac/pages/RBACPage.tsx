import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, KeyRound, ShieldCheck, UserCog, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { rbacApi } from '../../../core/api/services/rbac.api';
import { UserRole } from '../../../domain/models/user.model';
import { toast } from '../../../components/ui/Toast/toast.store';
import { DataTable } from '../../../components/table/DataTable';
import { Modal } from '../../../components/ui/Modal/Modal';
import { FormDrawer } from '../../../components/ui/Drawer/FormDrawer';
import { usePreferencesStore } from '../../../core/stores/preferences.store';
import { useAuthStore } from '../../auth/store/auth.store';

const inputClass =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#006A4E]';

const roleOptions = Object.values(UserRole).map((role) => ({ label: role, value: role }));

interface ShellProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  mode: 'modal' | 'drawer';
}

const RbacFormShell: React.FC<ShellProps> = ({ isOpen, title, onClose, children, mode }) => {
  if (mode === 'drawer') {
    return (
      <FormDrawer
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        fields={[]}
        onSubmit={() => undefined}
        size="lg"
      >
        {children}
      </FormDrawer>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      {children}
    </Modal>
  );
};

export const RBACPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { formPresentation } = usePreferencesStore();
  const { hasPermission } = useAuthStore();

  const canManage = hasPermission('rbac.manage');
  const canViewPermissions = canManage || hasPermission('rbac.permissions.view');
  const canViewRoles = canManage || hasPermission('rbac.roles.view');
  const canViewUsers = canManage || hasPermission('rbac.users.view');
  const canViewRolePermissions = canManage || hasPermission('rbac.role_permissions.view');
  const canViewUserRoles = canManage || hasPermission('rbac.user_roles.view');
  const canViewUserPermissions = canManage || hasPermission('rbac.user_permissions.view');

  const section = searchParams.get('section');
  const isOverview = !section || section === 'overview';
  const showPermissions = canViewPermissions && (isOverview || section === 'permissions');
  const showRoles = canViewRoles && (isOverview || section === 'roles');
  const showUsers = canViewUsers && (isOverview || section === 'users');
  const showRolePermissions = canViewRolePermissions && (isOverview || section === 'role-permissions');
  const showUserRoles = canViewUserRoles && (isOverview || section === 'user-roles');
  const showUserPermissions = canViewUserPermissions && (isOverview || section === 'user-permissions');

  const [newPermission, setNewPermission] = useState({ name: '', description: '', resource: '', action: '' });
  const [newRole, setNewRole] = useState({ name: '', description: '', permission_ids: [] as number[] });
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    password: '',
    base_role: UserRole.ALUMNI,
    role_ids: [] as number[],
    permission_ids: [] as number[],
  });

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [rolePermissionIds, setRolePermissionIds] = useState<number[]>([]);
  const [userRoleIds, setUserRoleIds] = useState<number[]>([]);
  const [userPermissionIds, setUserPermissionIds] = useState<number[]>([]);

  const [permissionSearch, setPermissionSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [roleMappingSearch, setRoleMappingSearch] = useState('');
  const [userRoleSearch, setUserRoleSearch] = useState('');
  const [userPermissionSearch, setUserPermissionSearch] = useState('');

  const [permissionFormOpen, setPermissionFormOpen] = useState(false);
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [roleMappingOpen, setRoleMappingOpen] = useState(false);
  const [userRoleOpen, setUserRoleOpen] = useState(false);
  const [userPermissionOpen, setUserPermissionOpen] = useState(false);

  const { data: permissions = [] } = useQuery({
    queryKey: ['rbac-permissions'],
    queryFn: () => rbacApi.getPermissions(),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['rbac-roles'],
    queryFn: () => rbacApi.getRoles(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['rbac-users'],
    queryFn: () => rbacApi.getUsers(),
  });

  const { data: selectedUserAssignments } = useQuery({
    queryKey: ['rbac-user-assignments', selectedUserId],
    queryFn: () => rbacApi.getUserAssignments(selectedUserId as number),
    enabled: !!selectedUserId,
  });

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId),
    [roles, selectedRoleId]
  );

  useEffect(() => {
    if (selectedRole) {
      setRolePermissionIds(selectedRole.permission_ids);
    }
  }, [selectedRole]);

  useEffect(() => {
    if (selectedUserAssignments) {
      setUserRoleIds(selectedUserAssignments.role_ids);
      setUserPermissionIds(selectedUserAssignments.permission_ids);
    }
  }, [selectedUserAssignments]);

  useEffect(() => {
    if (!roleMappingOpen) {
      setSelectedRoleId(null);
      setRolePermissionIds([]);
    }
  }, [roleMappingOpen]);

  useEffect(() => {
    if (!userRoleOpen) {
      setSelectedUserId(null);
      setUserRoleIds([]);
    }
  }, [userRoleOpen]);

  useEffect(() => {
    if (!userPermissionOpen) {
      setSelectedUserId(null);
      setUserPermissionIds([]);
    }
  }, [userPermissionOpen]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['rbac-permissions'] });
    await queryClient.invalidateQueries({ queryKey: ['rbac-roles'] });
    await queryClient.invalidateQueries({ queryKey: ['rbac-users'] });
    await queryClient.invalidateQueries({ queryKey: ['rbac-user-assignments'] });
  };

  const createPermissionMutation = useMutation({
    mutationFn: () => rbacApi.createPermission(newPermission),
    onSuccess: async () => {
      toast.success('Permission created');
      setNewPermission({ name: '', description: '', resource: '', action: '' });
      setPermissionFormOpen(false);
      await invalidate();
    },
    onError: (error: any) => toast.error(error?.response?.data?.detail || 'Failed to create permission'),
  });

  const syncPermissionsMutation = useMutation({
    mutationFn: () => rbacApi.syncPermissions(),
    onSuccess: async (result) => {
      toast.success(
        `Permission sync complete: ${result.created_count} created, ${result.existing_count} already existing`
      );
      await invalidate();
    },
    onError: (error: any) => toast.error(error?.response?.data?.detail || 'Failed to sync permissions'),
  });

  const createRoleMutation = useMutation({
    mutationFn: () => rbacApi.createRole(newRole),
    onSuccess: async () => {
      toast.success('Role created');
      setNewRole({ name: '', description: '', permission_ids: [] });
      setRoleFormOpen(false);
      await invalidate();
    },
    onError: (error: any) => toast.error(error?.response?.data?.detail || 'Failed to create role'),
  });

  const createUserMutation = useMutation({
    mutationFn: () => rbacApi.createUser(newUser),
    onSuccess: async () => {
      toast.success('User created');
      setNewUser({
        email: '',
        full_name: '',
        password: '',
        base_role: UserRole.ALUMNI,
        role_ids: [],
        permission_ids: [],
      });
      setUserFormOpen(false);
      await invalidate();
    },
    onError: (error: any) => toast.error(error?.response?.data?.detail || 'Failed to create user'),
  });

  const updateRolePermissionsMutation = useMutation({
    mutationFn: () => rbacApi.updateRolePermissions(selectedRoleId as number, rolePermissionIds),
    onSuccess: async () => {
      toast.success('Role-permission mapping updated');
      setRoleMappingOpen(false);
      await invalidate();
    },
    onError: (error: any) => toast.error(error?.response?.data?.detail || 'Failed to update role permissions'),
  });

  const updateUserRolesMutation = useMutation({
    mutationFn: () => rbacApi.updateUserRoles(selectedUserId as number, userRoleIds),
    onSuccess: async () => {
      toast.success('User-role assignment updated');
      setUserRoleOpen(false);
      await invalidate();
    },
    onError: (error: any) => toast.error(error?.response?.data?.detail || 'Failed to update user roles'),
  });

  const updateUserPermissionsMutation = useMutation({
    mutationFn: () => rbacApi.updateUserPermissions(selectedUserId as number, userPermissionIds),
    onSuccess: async () => {
      toast.success('User-permission assignment updated');
      setUserPermissionOpen(false);
      await invalidate();
    },
    onError: (error: any) => toast.error(error?.response?.data?.detail || 'Failed to update user permissions'),
  });

  const toggleId = (ids: number[], id: number) =>
    ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];

  const openRoleMappingForm = (roleId?: number) => {
    setSelectedRoleId(roleId || null);
    if (roleId) {
      const role = roles.find((x) => x.id === roleId);
      setRolePermissionIds(role?.permission_ids || []);
    } else {
      setRolePermissionIds([]);
    }
    setRoleMappingOpen(true);
  };

  const openUserRoleForm = (userId?: number) => {
    setSelectedUserId(userId || null);
    if (userId) {
      const user = users.find((x) => x.id === userId);
      setUserRoleIds(user?.role_ids || []);
    } else {
      setUserRoleIds([]);
    }
    setUserRoleOpen(true);
  };

  const openUserPermissionForm = (userId?: number) => {
    setSelectedUserId(userId || null);
    if (userId) {
      const user = users.find((x) => x.id === userId);
      setUserPermissionIds(user?.direct_permission_ids || []);
    } else {
      setUserPermissionIds([]);
    }
    setUserPermissionOpen(true);
  };

  const filteredPermissions = useMemo(() => {
    const term = permissionSearch.toLowerCase();
    return permissions.filter(
      (permission) =>
        permission.name.toLowerCase().includes(term) ||
        permission.resource.toLowerCase().includes(term) ||
        permission.action.toLowerCase().includes(term)
    );
  }, [permissions, permissionSearch]);

  const filteredRoles = useMemo(() => {
    const term = roleSearch.toLowerCase();
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(term) ||
        (role.description || '').toLowerCase().includes(term)
    );
  }, [roles, roleSearch]);

  const filteredUsers = useMemo(() => {
    const term = userSearch.toLowerCase();
    return users.filter(
      (user) =>
        user.full_name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.base_role.toLowerCase().includes(term)
    );
  }, [users, userSearch]);

  const filteredRoleMappings = useMemo(() => {
    const term = roleMappingSearch.toLowerCase();
    return roles.filter((role) => role.name.toLowerCase().includes(term));
  }, [roles, roleMappingSearch]);

  const filteredUserRoleMappings = useMemo(() => {
    const term = userRoleSearch.toLowerCase();
    return users.filter(
      (user) =>
        user.full_name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
    );
  }, [users, userRoleSearch]);

  const filteredUserPermissions = useMemo(() => {
    const term = userPermissionSearch.toLowerCase();
    return users.filter(
      (user) =>
        user.full_name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
    );
  }, [users, userPermissionSearch]);

  const submitButtonClass =
    'inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#006A4E] text-white hover:bg-[#00553f] disabled:opacity-50';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RBAC Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {canManage
            ? 'Create roles, users, permissions, and manage role or user assignment mappings.'
            : 'Read-only RBAC view enabled based on your permission mapping.'}
        </p>
      </div>

      {!canManage && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/10 dark:text-blue-300">
          You have RBAC view access. Add/Edit actions are disabled for this account.
        </div>
      )}

      {isOverview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-2 text-[#006A4E]">
              <KeyRound className="w-5 h-5" />
              <p className="text-sm font-semibold">Permissions</p>
            </div>
            <p className="text-3xl font-bold mt-3 text-gray-900 dark:text-white">{permissions.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-2 text-[#006A4E]">
              <ShieldCheck className="w-5 h-5" />
              <p className="text-sm font-semibold">Roles</p>
            </div>
            <p className="text-3xl font-bold mt-3 text-gray-900 dark:text-white">{roles.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-2 text-[#006A4E]">
              <Users className="w-5 h-5" />
              <p className="text-sm font-semibold">Users</p>
            </div>
            <p className="text-3xl font-bold mt-3 text-gray-900 dark:text-white">{users.length}</p>
          </div>
        </div>
      )}

      {showPermissions && (
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'resource', label: 'Resource' },
            { key: 'action', label: 'Action' },
            { key: 'description', label: 'Description', sortable: false },
          ]}
          data={filteredPermissions}
          searchable
          searchPlaceholder="Search permissions"
          onSearch={setPermissionSearch}
          emptyState={{ title: 'No permissions', description: 'Add your first permission to get started.' }}
          actions={canManage ? {
            custom: [
              {
                label: syncPermissionsMutation.isPending ? 'Syncing...' : 'Sync Permissions',
                onClick: () => {
                  if (!syncPermissionsMutation.isPending) syncPermissionsMutation.mutate();
                },
                variant: 'secondary',
              },
            ],
            add: { label: 'Add Permission', onClick: () => setPermissionFormOpen(true) },
          } : undefined}
        />
      )}

      {showRoles && (
        <DataTable
          columns={[
            { key: 'name', label: 'Role' },
            { key: 'description', label: 'Description', sortable: false },
            {
              key: 'is_system',
              label: 'System',
              render: (value) => (
                <span className={`px-2 py-1 rounded-full text-xs ${value ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                  {value ? 'Yes' : 'No'}
                </span>
              ),
            },
            {
              key: 'permission_ids',
              label: 'Permissions',
              render: (value: number[]) => value.length,
            },
          ]}
          data={filteredRoles}
          searchable
          searchPlaceholder="Search roles"
          onSearch={setRoleSearch}
          emptyState={{ title: 'No roles', description: 'Add your first role to assign permissions.' }}
          actions={canManage ? { add: { label: 'Add Role', onClick: () => setRoleFormOpen(true) } } : undefined}
        />
      )}

      {showUsers && (
        <DataTable
          columns={[
            { key: 'full_name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'base_role', label: 'Base Role' },
            {
              key: 'is_active',
              label: 'Status',
              render: (value) => (
                <span className={`px-2 py-1 rounded-full text-xs ${value ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'}`}>
                  {value ? 'Active' : 'Inactive'}
                </span>
              ),
            },
          ]}
          data={filteredUsers}
          searchable
          searchPlaceholder="Search users"
          onSearch={setUserSearch}
          emptyState={{ title: 'No users', description: 'Create users with role and permission assignments.' }}
          actions={canManage ? { add: { label: 'Add User', onClick: () => setUserFormOpen(true) } } : undefined}
        />
      )}

      {showRolePermissions && (
        <DataTable
          columns={[
            { key: 'name', label: 'Role' },
            {
              key: 'permissions',
              label: 'Permissions',
              sortable: false,
              render: (value: string[]) => value.join(', ') || 'No permissions',
            },
          ]}
          data={filteredRoleMappings}
          searchable
          searchPlaceholder="Search role mappings"
          onSearch={setRoleMappingSearch}
          emptyState={{ title: 'No role mappings', description: 'Add a role-permission mapping.' }}
          actions={canManage ? { add: { label: 'Add Mapping', onClick: () => openRoleMappingForm() } } : undefined}
          rowActions={canManage ? [
            {
              icon: Edit3,
              label: 'Edit mapping',
              onClick: (row) => openRoleMappingForm(row.id),
              variant: 'primary',
            },
          ] : undefined}
        />
      )}

      {showUserRoles && (
        <DataTable
          columns={[
            { key: 'full_name', label: 'User' },
            { key: 'email', label: 'Email' },
            {
              key: 'roles',
              label: 'Assigned Roles',
              sortable: false,
              render: (value: string[]) => value.join(', ') || 'No roles assigned',
            },
          ]}
          data={filteredUserRoleMappings}
          searchable
          searchPlaceholder="Search user role assignments"
          onSearch={setUserRoleSearch}
          emptyState={{ title: 'No user role assignments', description: 'Assign roles to users from here.' }}
          actions={canManage ? { add: { label: 'Assign User Roles', onClick: () => openUserRoleForm() } } : undefined}
          rowActions={canManage ? [
            {
              icon: Edit3,
              label: 'Edit assignment',
              onClick: (row) => openUserRoleForm(row.id),
              variant: 'primary',
            },
          ] : undefined}
        />
      )}

      {showUserPermissions && (
        <DataTable
          columns={[
            { key: 'full_name', label: 'User' },
            { key: 'email', label: 'Email' },
            {
              key: 'direct_permissions',
              label: 'Direct Permissions',
              sortable: false,
              render: (value: string[]) => value.join(', ') || 'No direct permissions',
            },
          ]}
          data={filteredUserPermissions}
          searchable
          searchPlaceholder="Search user permission assignments"
          onSearch={setUserPermissionSearch}
          emptyState={{ title: 'No direct permissions', description: 'Assign direct permissions to users.' }}
          actions={canManage ? { add: { label: 'Assign Permissions', onClick: () => openUserPermissionForm() } } : undefined}
          rowActions={canManage ? [
            {
              icon: Edit3,
              label: 'Edit assignment',
              onClick: (row) => openUserPermissionForm(row.id),
              variant: 'primary',
            },
          ] : undefined}
        />
      )}

      {canManage && <RbacFormShell
        isOpen={permissionFormOpen}
        title="Add Permission"
        onClose={() => setPermissionFormOpen(false)}
        mode={formPresentation}
      >
        <div className="space-y-4">
          <input className={inputClass} placeholder="Permission name (e.g. users.view)" value={newPermission.name} onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })} />
          <input className={inputClass} placeholder="Resource (e.g. users)" value={newPermission.resource} onChange={(e) => setNewPermission({ ...newPermission, resource: e.target.value })} />
          <input className={inputClass} placeholder="Action (e.g. view)" value={newPermission.action} onChange={(e) => setNewPermission({ ...newPermission, action: e.target.value })} />
          <textarea className={inputClass} placeholder="Description" value={newPermission.description} onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })} rows={3} />
          <div className="flex justify-end">
            <button className={submitButtonClass} onClick={() => createPermissionMutation.mutate()} disabled={createPermissionMutation.isPending}>
              Save Permission
            </button>
          </div>
        </div>
      </RbacFormShell>}

      {canManage && <RbacFormShell
        isOpen={roleFormOpen}
        title="Add Role"
        onClose={() => setRoleFormOpen(false)}
        mode={formPresentation}
      >
        <div className="space-y-4">
          <input className={inputClass} placeholder="Role name" value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} />
          <textarea className={inputClass} placeholder="Description" value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} rows={3} />
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Role permissions</p>
            <div className="max-h-56 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {permissions.map((permission) => (
                <label key={permission.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={newRole.permission_ids.includes(permission.id)}
                    onChange={() =>
                      setNewRole((prev) => ({
                        ...prev,
                        permission_ids: toggleId(prev.permission_ids, permission.id),
                      }))
                    }
                  />
                  {permission.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button className={submitButtonClass} onClick={() => createRoleMutation.mutate()} disabled={createRoleMutation.isPending}>
              Save Role
            </button>
          </div>
        </div>
      </RbacFormShell>}

      {canManage && <RbacFormShell
        isOpen={userFormOpen}
        title="Add User"
        onClose={() => setUserFormOpen(false)}
        mode={formPresentation}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className={inputClass} placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            <input className={inputClass} placeholder="Full name" value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} />
            <input className={inputClass} placeholder="Password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
            <select className={inputClass} value={newUser.base_role} onChange={(e) => setNewUser({ ...newUser, base_role: e.target.value as UserRole })}>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Assign roles</p>
            <div className="max-h-44 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roles.map((role) => (
                <label key={role.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={newUser.role_ids.includes(role.id)}
                    onChange={() => setNewUser((prev) => ({ ...prev, role_ids: toggleId(prev.role_ids, role.id) }))}
                  />
                  {role.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Direct permissions</p>
            <div className="max-h-44 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {permissions.map((permission) => (
                <label key={permission.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={newUser.permission_ids.includes(permission.id)}
                    onChange={() => setNewUser((prev) => ({ ...prev, permission_ids: toggleId(prev.permission_ids, permission.id) }))}
                  />
                  {permission.name}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button className={submitButtonClass} onClick={() => createUserMutation.mutate()} disabled={createUserMutation.isPending}>
              Save User
            </button>
          </div>
        </div>
      </RbacFormShell>}

      {canManage && <RbacFormShell
        isOpen={roleMappingOpen}
        title="Role Permission Mapping"
        onClose={() => setRoleMappingOpen(false)}
        mode={formPresentation}
      >
        <div className="space-y-4">
          <select className={inputClass} value={selectedRoleId || ''} onChange={(e) => setSelectedRoleId(Number(e.target.value) || null)}>
            <option value="">Select a role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {permissions.map((permission) => (
              <label key={permission.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={rolePermissionIds.includes(permission.id)}
                  onChange={() => setRolePermissionIds((prev) => toggleId(prev, permission.id))}
                />
                {permission.name}
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <button className={submitButtonClass} onClick={() => updateRolePermissionsMutation.mutate()} disabled={!selectedRoleId || updateRolePermissionsMutation.isPending}>
              Save Mapping
            </button>
          </div>
        </div>
      </RbacFormShell>}

      {canManage && <RbacFormShell
        isOpen={userRoleOpen}
        title="User Role Assignment"
        onClose={() => setUserRoleOpen(false)}
        mode={formPresentation}
      >
        <div className="space-y-4">
          <select className={inputClass} value={selectedUserId || ''} onChange={(e) => setSelectedUserId(Number(e.target.value) || null)}>
            <option value="">Select a user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name} ({user.email})
              </option>
            ))}
          </select>
          <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {roles.map((role) => (
              <label key={role.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={userRoleIds.includes(role.id)} onChange={() => setUserRoleIds((prev) => toggleId(prev, role.id))} />
                {role.name}
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <button className={submitButtonClass} onClick={() => updateUserRolesMutation.mutate()} disabled={!selectedUserId || updateUserRolesMutation.isPending}>
              Save User Roles
            </button>
          </div>
        </div>
      </RbacFormShell>}

      {canManage && <RbacFormShell
        isOpen={userPermissionOpen}
        title="User Permission Assignment"
        onClose={() => setUserPermissionOpen(false)}
        mode={formPresentation}
      >
        <div className="space-y-4">
          <select className={inputClass} value={selectedUserId || ''} onChange={(e) => setSelectedUserId(Number(e.target.value) || null)}>
            <option value="">Select a user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name} ({user.email})
              </option>
            ))}
          </select>
          <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {permissions.map((permission) => (
              <label key={permission.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={userPermissionIds.includes(permission.id)}
                  onChange={() => setUserPermissionIds((prev) => toggleId(prev, permission.id))}
                />
                {permission.name}
              </label>
            ))}
          </div>
          {selectedUserAssignments && (
            <div className="rounded-lg border border-[#006A4E]/20 bg-[#E8F4F0] dark:bg-emerald-900/20 p-3">
              <p className="text-sm font-semibold text-[#00553f] dark:text-emerald-200">Effective permissions</p>
              <p className="mt-1 text-xs text-[#006A4E] dark:text-emerald-300">
                {selectedUserAssignments.effective_permissions.join(', ') || 'No permissions assigned'}
              </p>
            </div>
          )}
          <div className="flex justify-end">
            <button className={submitButtonClass} onClick={() => updateUserPermissionsMutation.mutate()} disabled={!selectedUserId || updateUserPermissionsMutation.isPending}>
              Save User Permissions
            </button>
          </div>
        </div>
      </RbacFormShell>}
    </div>
  );
};
