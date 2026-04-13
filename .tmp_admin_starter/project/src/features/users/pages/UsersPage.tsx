import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Mail, Calendar, Eye } from 'lucide-react';
import { userApi } from '../../../core/api/services/user.api';
import { User, UserRole, UserStatus } from '../../../domain/models/user.model';
import { CreateUserRequestDto, UpdateUserRequestDto } from '../../../domain/dto/user.dto';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { Modal } from '../../../components/ui/Modal/Modal';
import { DynamicForm, FormField } from '../../../components/form/DynamicForm';
import { toast } from '../../../components/ui/Toast/toast.store';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users', page, pageSize, search, sortBy, sortOrder],
    queryFn: () =>
      userApi.getUsers({
        page,
        pageSize,
        search,
        sortBy,
        sortOrder,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
      setDeleteUserId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateUserRequestDto) => userApi.createUser(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      setShowAddModal(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserRequestDto }) => userApi.updateUser(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
      setEditUser(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user');
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleCreateUser = (formData: Record<string, any>) => {
    const dto: CreateUserRequestDto = {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      fullName: `${formData.firstName} ${formData.lastName}`,
      role: formData.role,
      status: formData.status,
      permissions: getDefaultPermissions(formData.role),
    };
    createMutation.mutate(dto);
  };

  const handleUpdateUser = (formData: Record<string, any>) => {
    if (!editUser) return;
    const dto: UpdateUserRequestDto = {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      fullName: `${formData.firstName} ${formData.lastName}`,
      role: formData.role,
      status: formData.status,
    };
    updateMutation.mutate({ id: editUser.id, dto });
  };

  const getDefaultPermissions = (role: UserRole): string[] => {
    switch (role) {
      case UserRole.ADMIN:
        return ['users.view', 'users.create', 'users.edit', 'users.delete', 'dashboard.view', 'settings.view', 'reports.view'];
      case UserRole.MANAGER:
        return ['users.view', 'users.edit', 'dashboard.view', 'reports.view'];
      default:
        return ['dashboard.view'];
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          colors[status as keyof typeof colors] || colors.inactive
        }`}
      >
        {status}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      user: 'bg-gray-100 text-gray-800',
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          colors[role as keyof typeof colors] || colors.user
        }`}
      >
        {role}
      </span>
    );
  };

  const columns: Column<User>[] = [
    {
      key: 'fullName',
      label: 'Name',
      sortable: true,
      render: (_, user) => (
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <img src={user.avatar} alt={user.fullName} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user.firstName[0]}
                {user.lastName[0]}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user.fullName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {user.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (role) => getRoleBadge(role as string),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (status) => getStatusBadge(status as string),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (date) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(date as string).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const rowActions: RowAction<User>[] = [
    {
      icon: Eye,
      label: 'View',
      onClick: (user) => setViewUser(user),
      variant: 'secondary',
    },
    {
      icon: Pencil,
      label: 'Edit',
      onClick: (user) => setEditUser(user),
      variant: 'primary',
    },
    {
      icon: Trash2,
      label: 'Delete',
      onClick: (user) => setDeleteUserId(user.id),
      variant: 'danger',
    },
  ];

  const userFormFields: FormField[] = [
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      required: true,
      placeholder: 'John',
      defaultValue: editUser?.firstName || '',
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      required: true,
      placeholder: 'Doe',
      defaultValue: editUser?.lastName || '',
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'john@example.com',
      defaultValue: editUser?.email || '',
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: [
        { label: 'Admin', value: UserRole.ADMIN },
        { label: 'Manager', value: UserRole.MANAGER },
        { label: 'User', value: UserRole.USER },
      ],
      defaultValue: editUser?.role || UserRole.USER,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Active', value: UserStatus.ACTIVE },
        { label: 'Inactive', value: UserStatus.INACTIVE },
        { label: 'Suspended', value: UserStatus.SUSPENDED },
      ],
      defaultValue: editUser?.status || UserStatus.ACTIVE,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage user accounts and permissions</p>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        error={error?.message}
        searchable
        searchPlaceholder="Search users by name or email..."
        onSearch={setSearch}
        sortable
        onSort={(key, order) => {
          setSortBy(key as string);
          setSortOrder(order);
        }}
        pagination={
          data
            ? {
                currentPage: data.page,
                totalPages: data.totalPages,
                pageSize: data.pageSize,
                total: data.total,
                onPageChange: setPage,
                onPageSizeChange: (size) => {
                  setPageSize(size);
                  setPage(1);
                },
              }
            : undefined
        }
        emptyState={{
          title: 'No users found',
          description: 'Try adjusting your search criteria',
        }}
        actions={{
          add: {
            label: 'Add User',
            onClick: () => setShowAddModal(true),
          },
        }}
        rowActions={rowActions}
        onRetry={() => refetch()}
      />

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New User"
        size="md"
      >
        <DynamicForm
          fields={userFormFields}
          onSubmit={handleCreateUser}
          submitLabel="Create User"
          onCancel={() => setShowAddModal(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={editUser !== null} onClose={() => setEditUser(null)} title="Edit User" size="md">
        {editUser && (
          <DynamicForm
            fields={userFormFields}
            onSubmit={handleUpdateUser}
            submitLabel="Update User"
            onCancel={() => setEditUser(null)}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      <Modal isOpen={viewUser !== null} onClose={() => setViewUser(null)} title="User Details" size="md">
        {viewUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {viewUser.avatar ? (
                <img src={viewUser.avatar} alt={viewUser.fullName} className="w-20 h-20 rounded-full" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-2xl font-medium">
                    {viewUser.firstName[0]}
                    {viewUser.lastName[0]}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{viewUser.fullName}</h3>
                <p className="text-gray-600 dark:text-gray-400">{viewUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</p>
                <div className="mt-1">{getRoleBadge(viewUser.role)}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                <div className="mt-1">{getStatusBadge(viewUser.status)}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {new Date(viewUser.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Login</p>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {viewUser.lastLogin ? new Date(viewUser.lastLogin).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Permissions</p>
              <div className="flex flex-wrap gap-2">
                {viewUser.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteUserId !== null}
        onClose={() => setDeleteUserId(null)}
        onConfirm={() => deleteUserId && handleDelete(deleteUserId)}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
