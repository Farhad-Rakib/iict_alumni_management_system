import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Event, EventListItem, EventPayment } from '../../../domain/models/event.model';
import { EventCreateRequestDto, EventUpdateRequestDto, EventPaymentCreateRequestDto } from '../../../domain/dto/event.dto';
import { eventApi } from '../../../core/api/services/event.api';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { Modal } from '../../../components/ui/Modal/Modal';
import { DynamicForm, FormField } from '../../../components/form/DynamicForm';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { toast } from '../../../components/ui/Toast/toast.store';
import { useAuthStore } from '../../auth/store/auth.store';

export const EventsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasAnyPermission } = useAuthStore();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [viewEvent, setViewEvent] = useState<Event | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [paymentEventId, setPaymentEventId] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentCreate, setShowPaymentCreate] = useState(false);

  const canCreate = hasAnyPermission(['events.create']);
  const canEdit = hasAnyPermission(['events.edit', 'events.update']);
  const canDelete = hasAnyPermission(['events.delete']);
  const canManagePayments = hasAnyPermission(['events.payments.create', 'events.payments.read']);

  const { data, isLoading, error } = useQuery({
    queryKey: ['events', page, pageSize, search],
    queryFn: () => eventApi.getEvents({ page, pageSize, search }),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['event-payments', paymentEventId],
    queryFn: () => eventApi.getEventPayments(paymentEventId as number),
    enabled: Boolean(paymentEventId) && showPaymentModal,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => eventApi.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event deleted');
      setDeleteId(null);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to delete event'),
  });

  const createMutation = useMutation({
    mutationFn: (dto: EventCreateRequestDto) => eventApi.createEvent(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event created');
      setShowCreateModal(false);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create event'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: EventUpdateRequestDto }) => eventApi.updateEvent(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Event updated');
      setEditEvent(null);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update event'),
  });

  const createPaymentMutation = useMutation({
    mutationFn: ({ eventId, dto }: { eventId: number; dto: EventPaymentCreateRequestDto }) =>
      eventApi.createEventPayment(eventId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-payments', paymentEventId] });
      toast.success('Payment recorded');
      setShowPaymentCreate(false);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to record payment'),
  });

  const columns: Column<EventListItem>[] = useMemo(
    () => [
      { key: 'title', label: 'Title', sortable: false },
      { key: 'startDate', label: 'Start', sortable: false },
      { key: 'endDate', label: 'End', sortable: false },
      { key: 'location', label: 'Location', sortable: false },
      { key: 'isPaid', label: 'Paid', sortable: false, render: (value) => (value ? 'Yes' : 'No') },
      { key: 'fee', label: 'Fee', sortable: false },
    ],
    []
  );

  const rowActions: RowAction<EventListItem>[] = [
    {
      icon: Eye,
      label: 'View',
      onClick: async (item) => {
        const detail = await eventApi.getEventById(item.id);
        setViewEvent(detail);
      },
      variant: 'secondary',
    },
    {
      icon: Pencil,
      label: 'Edit',
      onClick: async (item) => {
        const detail = await eventApi.getEventById(item.id);
        setEditEvent(detail);
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
    {
      icon: Eye,
      label: 'Payments',
      onClick: (item) => {
        setPaymentEventId(item.id);
        setShowPaymentModal(true);
      },
      variant: 'secondary',
      show: (item) => item.isPaid && canManagePayments,
    },
  ];

  const createFields: FormField[] = [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea', required: true },
    { name: 'eventType', label: 'Event Type', type: 'text' },
    { name: 'startDate', label: 'Start Date', type: 'text', required: true, placeholder: 'YYYY-MM-DDTHH:mm:ss' },
    { name: 'endDate', label: 'End Date', type: 'text', required: true, placeholder: 'YYYY-MM-DDTHH:mm:ss' },
    { name: 'location', label: 'Location', type: 'text' },
    { name: 'isOnline', label: 'Online Event', type: 'checkbox', defaultValue: false },
    { name: 'meetingLink', label: 'Meeting Link', type: 'text' },
    { name: 'isPaid', label: 'Paid Event', type: 'checkbox', defaultValue: false },
    { name: 'fee', label: 'Fee', type: 'number' },
    { name: 'currency', label: 'Currency', type: 'text', defaultValue: 'USD' },
    { name: 'maxCapacity', label: 'Max Capacity', type: 'number' },
    { name: 'organizedBy', label: 'Organized By', type: 'text' },
  ];

  const editFields: FormField[] = [
    { name: 'title', label: 'Title', type: 'text', defaultValue: editEvent?.title || '' },
    { name: 'description', label: 'Description', type: 'textarea', defaultValue: editEvent?.description || '' },
    { name: 'eventType', label: 'Event Type', type: 'text', defaultValue: editEvent?.eventType || '' },
    { name: 'startDate', label: 'Start Date', type: 'text', defaultValue: editEvent?.startDate || '' },
    { name: 'endDate', label: 'End Date', type: 'text', defaultValue: editEvent?.endDate || '' },
    { name: 'location', label: 'Location', type: 'text', defaultValue: editEvent?.location || '' },
    { name: 'isOnline', label: 'Online Event', type: 'checkbox', defaultValue: editEvent?.isOnline ?? false },
    { name: 'meetingLink', label: 'Meeting Link', type: 'text', defaultValue: editEvent?.meetingLink || '' },
    { name: 'isPaid', label: 'Paid Event', type: 'checkbox', defaultValue: editEvent?.isPaid ?? false },
    { name: 'fee', label: 'Fee', type: 'number', defaultValue: editEvent?.fee ?? 0 },
    { name: 'currency', label: 'Currency', type: 'text', defaultValue: editEvent?.currency || 'USD' },
    { name: 'maxCapacity', label: 'Max Capacity', type: 'number', defaultValue: editEvent?.maxCapacity ?? 0 },
    { name: 'organizedBy', label: 'Organized By', type: 'text', defaultValue: editEvent?.organizedBy || '' },
    { name: 'isPublished', label: 'Published', type: 'checkbox', defaultValue: editEvent?.isPublished ?? false },
  ];

  const handleCreate = (formData: Record<string, any>) => {
    const dto: EventCreateRequestDto = {
      title: formData.title,
      description: formData.description,
      eventType: formData.eventType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      location: formData.location,
      isOnline: formData.isOnline,
      meetingLink: formData.meetingLink,
      isPaid: formData.isPaid,
      fee: formData.fee,
      currency: formData.currency,
      maxCapacity: formData.maxCapacity,
      organizedBy: formData.organizedBy,
    };
    createMutation.mutate(dto);
  };

  const handleUpdate = (formData: Record<string, any>) => {
    if (!editEvent) return;
    const dto: EventUpdateRequestDto = {
      title: formData.title,
      description: formData.description,
      eventType: formData.eventType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      location: formData.location,
      isOnline: formData.isOnline,
      meetingLink: formData.meetingLink,
      isPaid: formData.isPaid,
      fee: formData.fee,
      maxCapacity: formData.maxCapacity,
      organizedBy: formData.organizedBy,
      isPublished: formData.isPublished,
    };
    updateMutation.mutate({ id: editEvent.id, dto });
  };

  const handlePaymentCreate = (formData: Record<string, any>) => {
    if (!paymentEventId) return;
    const dto: EventPaymentCreateRequestDto = {
      amount: Number(formData.amount) || 0,
      currency: formData.currency,
      status: formData.status,
      paymentMethod: formData.paymentMethod,
      transactionId: formData.transactionId,
    };
    createPaymentMutation.mutate({ eventId: paymentEventId, dto });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Events</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage alumni events and RSVPs.</p>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        error={error ? 'Failed to load events' : undefined}
        searchPlaceholder="Search events"
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
                  label: 'Add Event',
                  onClick: () => setShowCreateModal(true),
                },
              }
            : undefined
        }
        rowActions={rowActions}
      />

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Event">
        <DynamicForm
          fields={createFields}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          submitLabel="Create"
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={Boolean(editEvent)} onClose={() => setEditEvent(null)} title="Edit Event">
        <DynamicForm
          fields={editFields}
          onSubmit={handleUpdate}
          onCancel={() => setEditEvent(null)}
          submitLabel="Save"
          isLoading={updateMutation.isPending}
        />
      </Modal>

      <Modal isOpen={Boolean(viewEvent)} onClose={() => setViewEvent(null)} title="Event Details">
        {viewEvent && (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div><span className="font-medium text-gray-900 dark:text-white">Title:</span> {viewEvent.title}</div>
            <div><span className="font-medium text-gray-900 dark:text-white">Start:</span> {viewEvent.startDate}</div>
            <div><span className="font-medium text-gray-900 dark:text-white">End:</span> {viewEvent.endDate}</div>
            <div><span className="font-medium text-gray-900 dark:text-white">Location:</span> {viewEvent.location || 'N/A'}</div>
            <div><span className="font-medium text-gray-900 dark:text-white">Paid:</span> {viewEvent.isPaid ? 'Yes' : 'No'}</div>
            <div><span className="font-medium text-gray-900 dark:text-white">Fee:</span> {viewEvent.fee}</div>
            <div><span className="font-medium text-gray-900 dark:text-white">Description:</span> {viewEvent.description}</div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Delete Event"
        message="Are you sure you want to delete this event?"
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        confirmText="Delete"
        variant="danger"
      />

      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Event Payments">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Payments</h3>
            {canManagePayments && (
              <button
                onClick={() => setShowPaymentCreate(true)}
                className="px-3 py-1.5 text-xs rounded-lg bg-[#006A4E] text-white"
              >
                Record Payment
              </button>
            )}
          </div>
          {payments.length === 0 ? (
            <p className="text-sm text-gray-500">No payments recorded.</p>
          ) : (
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              {payments.map((payment: EventPayment) => (
                <div key={payment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div><span className="font-medium">Amount:</span> {payment.amount} {payment.currency}</div>
                  <div><span className="font-medium">Status:</span> {payment.status}</div>
                  {payment.paymentMethod && <div><span className="font-medium">Method:</span> {payment.paymentMethod}</div>}
                  {payment.transactionId && <div><span className="font-medium">Transaction:</span> {payment.transactionId}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={showPaymentCreate} onClose={() => setShowPaymentCreate(false)} title="Record Payment">
        <DynamicForm
          fields={[
            { name: 'amount', label: 'Amount', type: 'number', required: true },
            { name: 'currency', label: 'Currency', type: 'text', defaultValue: 'USD' },
            { name: 'status', label: 'Status', type: 'text', defaultValue: 'completed' },
            { name: 'paymentMethod', label: 'Payment Method', type: 'text' },
            { name: 'transactionId', label: 'Transaction ID', type: 'text' },
          ]}
          onSubmit={handlePaymentCreate}
          onCancel={() => setShowPaymentCreate(false)}
          submitLabel="Save"
          isLoading={createPaymentMutation.isPending}
        />
      </Modal>
    </div>
  );
};
