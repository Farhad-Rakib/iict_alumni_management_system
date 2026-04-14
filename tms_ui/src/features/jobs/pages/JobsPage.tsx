import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Job, JobListItem } from '../../../domain/models/job.model';
import { JobCreateRequestDto, JobUpdateRequestDto } from '../../../domain/dto/job.dto';
import { jobApi } from '../../../core/api/services/job.api';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { Modal } from '../../../components/ui/Modal/Modal';
import { DynamicForm, FormField } from '../../../components/form/DynamicForm';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { toast } from '../../../components/ui/Toast/toast.store';
import { useAuthStore } from '../../auth/store/auth.store';

export const JobsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasAnyPermission } = useAuthStore();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [viewJob, setViewJob] = useState<Job | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canCreate = hasAnyPermission(['jobs.create']);
  const canEdit = hasAnyPermission(['jobs.edit', 'jobs.update']);
  const canDelete = hasAnyPermission(['jobs.delete']);

  const { data, isLoading, error } = useQuery({
    queryKey: ['jobs', page, pageSize, search],
    queryFn: () => jobApi.getJobs({ page, pageSize, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => jobApi.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job deleted');
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to delete job'),
  });

  const createMutation = useMutation({
    mutationFn: (dto: JobCreateRequestDto) => jobApi.createJob(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job created');
      setShowCreateModal(false);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create job'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: JobUpdateRequestDto }) => jobApi.updateJob(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job updated');
      setEditJob(null);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update job'),
  });

  const columns: Column<JobListItem>[] = useMemo(
    () => [
      { key: 'title', label: 'Title', sortable: false },
      { key: 'company', label: 'Company', sortable: false },
      { key: 'location', label: 'Location', sortable: false },
      { key: 'jobType', label: 'Type', sortable: false },
      { key: 'experienceLevel', label: 'Level', sortable: false },
      { key: 'expiresAt', label: 'Expires', sortable: false },
    ],
    []
  );

  const rowActions: RowAction<JobListItem>[] = [
    {
      icon: Eye,
      label: 'View',
      onClick: async (item) => {
        const detail = await jobApi.getJobById(item.id);
        setViewJob(detail);
      },
      variant: 'secondary',
    },
    {
      icon: Pencil,
      label: 'Edit',
      onClick: async (item) => {
        const detail = await jobApi.getJobById(item.id);
        setEditJob(detail);
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
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea', required: true },
    { name: 'company', label: 'Company', type: 'text', required: true },
    { name: 'location', label: 'Location', type: 'text' },
    { name: 'jobType', label: 'Job Type', type: 'text', required: true },
    { name: 'requiredSkills', label: 'Required Skills', type: 'text' },
    { name: 'experienceLevel', label: 'Experience Level', type: 'text' },
    { name: 'experienceYears', label: 'Experience Years', type: 'number' },
    { name: 'applyLink', label: 'Apply Link', type: 'text', required: true },
    { name: 'applyInternally', label: 'Apply Internally', type: 'checkbox', defaultValue: false },
    { name: 'expiresAt', label: 'Expires At', type: 'text', required: true, placeholder: 'YYYY-MM-DDTHH:mm:ss' },
  ];

  const editFields: FormField[] = [
    { name: 'title', label: 'Title', type: 'text', defaultValue: editJob?.title || '' },
    { name: 'description', label: 'Description', type: 'textarea', defaultValue: editJob?.description || '' },
    { name: 'company', label: 'Company', type: 'text', defaultValue: editJob?.company || '' },
    { name: 'location', label: 'Location', type: 'text', defaultValue: editJob?.location || '' },
    { name: 'jobType', label: 'Job Type', type: 'text', defaultValue: editJob?.jobType || '' },
    { name: 'requiredSkills', label: 'Required Skills', type: 'text', defaultValue: editJob?.requiredSkills || '' },
    { name: 'experienceLevel', label: 'Experience Level', type: 'text', defaultValue: editJob?.experienceLevel || '' },
    { name: 'experienceYears', label: 'Experience Years', type: 'number', defaultValue: editJob?.experienceYears || 0 },
    { name: 'applyLink', label: 'Apply Link', type: 'text', defaultValue: editJob?.applyLink || '' },
    { name: 'applyInternally', label: 'Apply Internally', type: 'checkbox', defaultValue: editJob?.applyInternally ?? false },
    { name: 'expiresAt', label: 'Expires At', type: 'text', defaultValue: editJob?.expiresAt || '' },
    { name: 'isActive', label: 'Active', type: 'checkbox', defaultValue: editJob?.isActive ?? true },
  ];

  const handleCreate = (formData: Record<string, any>) => {
    const dto: JobCreateRequestDto = {
      title: formData.title,
      description: formData.description,
      company: formData.company,
      location: formData.location,
      jobType: formData.jobType,
      requiredSkills: formData.requiredSkills,
      experienceLevel: formData.experienceLevel,
      experienceYears: formData.experienceYears,
      applyLink: formData.applyLink,
      applyInternally: formData.applyInternally,
      expiresAt: formData.expiresAt,
    };
    createMutation.mutate(dto);
  };

  const handleUpdate = (formData: Record<string, any>) => {
    if (!editJob) return;
    const dto: JobUpdateRequestDto = {
      title: formData.title,
      description: formData.description,
      company: formData.company,
      location: formData.location,
      jobType: formData.jobType,
      requiredSkills: formData.requiredSkills,
      experienceLevel: formData.experienceLevel,
      experienceYears: formData.experienceYears,
      applyLink: formData.applyLink,
      applyInternally: formData.applyInternally,
      expiresAt: formData.expiresAt,
      isActive: formData.isActive,
    };
    updateMutation.mutate({ id: editJob.id, dto });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jobs</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage job postings and visibility.</p>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        error={error ? 'Failed to load jobs' : undefined}
        searchPlaceholder="Search jobs"
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
                  label: 'Add Job',
                  onClick: () => setShowCreateModal(true),
                },
              }
            : undefined
        }
        rowActions={rowActions}
      />

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Job">
        <DynamicForm
          fields={createFields}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          submitLabel="Create"
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={Boolean(editJob)} onClose={() => setEditJob(null)} title="Edit Job">
        <DynamicForm
          fields={editFields}
          onSubmit={handleUpdate}
          onCancel={() => setEditJob(null)}
          submitLabel="Save"
          isLoading={updateMutation.isPending}
        />
      </Modal>

      <Modal isOpen={Boolean(viewJob)} onClose={() => setViewJob(null)} title="Job Details">
        {viewJob && (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div><span className="font-medium text-gray-900 dark:text-white">Title:</span> {viewJob.title}</div>
            <div><span className="font-medium text-gray-900 dark:text-white">Company:</span> {viewJob.company}</div>
            <div><span className="font-medium text-gray-900 dark:text-white">Location:</span> {viewJob.location || 'N/A'}</div>
            <div><span className="font-medium text-gray-900 dark:text-white">Type:</span> {viewJob.jobType}</div>
            <div><span className="font-medium text-gray-900 dark:text-white">Apply Link:</span> {viewJob.applyLink}</div>
            <div><span className="font-medium text-gray-900 dark:text-white">Expires At:</span> {viewJob.expiresAt}</div>
            <div><span className="font-medium text-gray-900 dark:text-white">Description:</span> {viewJob.description}</div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Delete Job"
        message="Are you sure you want to delete this job posting?"
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
