import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Alumni, AlumniListItem } from '../../../domain/models/alumni.model';
import { AlumniCreateRequestDto, AlumniUpdateRequestDto } from '../../../domain/dto/alumni.dto';
import { alumniApi } from '../../../core/api/services/alumni.api';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { Modal } from '../../../components/ui/Modal/Modal';
import { DynamicForm, FormField } from '../../../components/form/DynamicForm';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { toast } from '../../../components/ui/Toast/toast.store';
import { useAuthStore } from '../../auth/store/auth.store';

export const AlumniPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasAnyPermission } = useAuthStore();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editAlumni, setEditAlumni] = useState<Alumni | null>(null);
  const [viewAlumni, setViewAlumni] = useState<Alumni | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canCreate = hasAnyPermission(['alumni.create']);
  const canEdit = hasAnyPermission(['alumni.edit', 'alumni.update']);
  const canDelete = hasAnyPermission(['alumni.delete']);

  const { data, isLoading, error } = useQuery({
    queryKey: ['alumni', page, pageSize, search],
    queryFn: () => alumniApi.getAlumni({ page, pageSize, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => alumniApi.deleteAlumni(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumni'] });
      toast.success('Alumni deleted');
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to delete alumni'),
  });

  const createMutation = useMutation({
    mutationFn: (dto: AlumniCreateRequestDto) => alumniApi.createAlumni(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumni'] });
      toast.success('Alumni created');
      setShowCreateModal(false);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create alumni'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: AlumniUpdateRequestDto }) => alumniApi.updateAlumni(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumni'] });
      toast.success('Alumni updated');
      setEditAlumni(null);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update alumni'),
  });

  const columns: Column<AlumniListItem>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Name',
        sortable: false,
      },
      {
        key: 'batch',
        label: 'Batch',
        sortable: false,
      },
      {
        key: 'department',
        label: 'Department',
        sortable: false,
      },
      {
        key: 'profession',
        label: 'Profession',
        sortable: false,
      },
      {
        key: 'company',
        label: 'Company',
        sortable: false,
      },
      {
        key: 'country',
        label: 'Country',
        sortable: false,
      },
    ],
    []
  );

  const rowActions: RowAction<AlumniListItem>[] = [
    {
      icon: Eye,
      label: 'View',
      onClick: async (item) => {
        const detail = await alumniApi.getAlumniById(item.id);
        setViewAlumni(detail);
      },
      variant: 'secondary',
    },
    {
      icon: Pencil,
      label: 'Edit',
      onClick: async (item) => {
        const detail = await alumniApi.getAlumniById(item.id);
        setEditAlumni(detail);
      },
      variant: 'primary',
      show: () => canEdit,
    },
    {
      icon: Trash2,
      label: 'Delete',
      onClick: (item) => setDeleteId(item.id),
      variant: 'danger',
      show: () => canDelete,
    },
  ];

  const createFields: FormField[] = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'batch', label: 'Batch', type: 'text', required: true },
    { name: 'department', label: 'Department', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'profession', label: 'Profession', type: 'text' },
    { name: 'company', label: 'Company', type: 'text' },
    { name: 'country', label: 'Country', type: 'text' },
    { name: 'city', label: 'City', type: 'text' },
    { name: 'bio', label: 'Bio', type: 'textarea' },
    { name: 'skills', label: 'Skills', type: 'text' },
    { name: 'linkedinUrl', label: 'LinkedIn URL', type: 'text' },
    { name: 'githubUrl', label: 'GitHub URL', type: 'text' },
    { name: 'portfolioUrl', label: 'Portfolio URL', type: 'text' },
  ];

  const editFields: FormField[] = [
    { name: 'name', label: 'Name', type: 'text', defaultValue: editAlumni?.name || '' },
    { name: 'profession', label: 'Profession', type: 'text', defaultValue: editAlumni?.profession || '' },
    { name: 'company', label: 'Company', type: 'text', defaultValue: editAlumni?.company || '' },
    { name: 'country', label: 'Country', type: 'text', defaultValue: editAlumni?.country || '' },
    { name: 'city', label: 'City', type: 'text', defaultValue: editAlumni?.city || '' },
    { name: 'bio', label: 'Bio', type: 'textarea', defaultValue: editAlumni?.bio || '' },
    { name: 'skills', label: 'Skills', type: 'text', defaultValue: editAlumni?.skills || '' },
    { name: 'linkedinUrl', label: 'LinkedIn URL', type: 'text', defaultValue: editAlumni?.linkedinUrl || '' },
    { name: 'githubUrl', label: 'GitHub URL', type: 'text', defaultValue: editAlumni?.githubUrl || '' },
    { name: 'portfolioUrl', label: 'Portfolio URL', type: 'text', defaultValue: editAlumni?.portfolioUrl || '' },
    {
      name: 'receiveEmails',
      label: 'Receive Emails',
      type: 'checkbox',
      defaultValue: editAlumni?.receiveEmails ?? true,
    },
    {
      name: 'receiveEventNotifications',
      label: 'Receive Event Notifications',
      type: 'checkbox',
      defaultValue: editAlumni?.receiveEventNotifications ?? true,
    },
  ];

  const handleCreate = (formData: Record<string, any>) => {
    const dto: AlumniCreateRequestDto = {
      name: formData.name,
      batch: formData.batch,
      department: formData.department,
      email: formData.email,
      phone: formData.phone,
      profession: formData.profession,
      company: formData.company,
      country: formData.country,
      city: formData.city,
      bio: formData.bio,
      skills: formData.skills,
      linkedinUrl: formData.linkedinUrl,
      githubUrl: formData.githubUrl,
      portfolioUrl: formData.portfolioUrl,
    };
    createMutation.mutate(dto);
  };

  const handleUpdate = (formData: Record<string, any>) => {
    if (!editAlumni) return;
    const dto: AlumniUpdateRequestDto = {
      name: formData.name,
      profession: formData.profession,
      company: formData.company,
      country: formData.country,
      city: formData.city,
      bio: formData.bio,
      skills: formData.skills,
      linkedinUrl: formData.linkedinUrl,
      githubUrl: formData.githubUrl,
      portfolioUrl: formData.portfolioUrl,
      receiveEmails: formData.receiveEmails,
      receiveEventNotifications: formData.receiveEventNotifications,
    };
    updateMutation.mutate({ id: editAlumni.id, dto });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alumni</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage alumni profiles and directory access.</p>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        error={error ? 'Failed to load alumni' : undefined}
        searchPlaceholder="Search alumni"
        onSearch={(term) => {
          setSearch(term);
          setPage(1);
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
        actions={
          canCreate
            ? {
                add: {
                  label: 'Add Alumni',
                  onClick: () => setShowCreateModal(true),
                },
              }
            : undefined
        }
        rowActions={rowActions}
      />

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Alumni">
        <DynamicForm
          fields={createFields}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          submitLabel="Create"
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={Boolean(editAlumni)} onClose={() => setEditAlumni(null)} title="Edit Alumni">
        <DynamicForm
          fields={editFields}
          onSubmit={handleUpdate}
          onCancel={() => setEditAlumni(null)}
          submitLabel="Save"
          isLoading={updateMutation.isPending}
        />
      </Modal>

      <Modal isOpen={Boolean(viewAlumni)} onClose={() => setViewAlumni(null)} title="Alumni Details">
        {viewAlumni && (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div><span className="font-medium text-gray-900 dark:text-white">Name:</span> {viewAlumni.name}</div>
            <div><span className="font-medium text-gray-900 dark:text-white">Email:</span> {viewAlumni.email}</div>
            <div><span className="font-medium text-gray-900 dark:text-white">Batch:</span> {viewAlumni.batch}</div>
            <div><span className="font-medium text-gray-900 dark:text-white">Department:</span> {viewAlumni.department}</div>
            {viewAlumni.profession && <div><span className="font-medium text-gray-900 dark:text-white">Profession:</span> {viewAlumni.profession}</div>}
            {viewAlumni.company && <div><span className="font-medium text-gray-900 dark:text-white">Company:</span> {viewAlumni.company}</div>}
            {viewAlumni.country && <div><span className="font-medium text-gray-900 dark:text-white">Country:</span> {viewAlumni.country}</div>}
            {viewAlumni.city && <div><span className="font-medium text-gray-900 dark:text-white">City:</span> {viewAlumni.city}</div>}
            {viewAlumni.bio && <div><span className="font-medium text-gray-900 dark:text-white">Bio:</span> {viewAlumni.bio}</div>}
            {viewAlumni.skills && <div><span className="font-medium text-gray-900 dark:text-white">Skills:</span> {viewAlumni.skills}</div>}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Delete Alumni"
        message="Are you sure you want to delete this alumni profile?"
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
