import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Trash2, PlusCircle, Vote } from 'lucide-react';
import { electionApi } from '../../../core/api/services/election.api';
import {
  Election,
  ElectionListItem,
  ElectionPosition,
  ElectionResult,
  VotingLogEntry,
} from '../../../domain/models/election.model';
import {
  ElectionCreateRequestDto,
  ElectionUpdateRequestDto,
  PositionCreateRequestDto,
  CandidateCreateRequestDto,
} from '../../../domain/dto/election.dto';
import { DataTable, Column, RowAction } from '../../../components/table/DataTable';
import { Modal } from '../../../components/ui/Modal/Modal';
import { DynamicForm, FormField } from '../../../components/form/DynamicForm';
import { ConfirmDialog } from '../../../components/ui/Dialog/ConfirmDialog';
import { toast } from '../../../components/ui/Toast/toast.store';
import { useAuthStore } from '../../auth/store/auth.store';

export const ElectionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasAnyPermission } = useAuthStore();

  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editElection, setEditElection] = useState<Election | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [manageElectionId, setManageElectionId] = useState<number | null>(null);
  const [positions, setPositions] = useState<ElectionPosition[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [resultElection, setResultElection] = useState<ElectionResult | null>(null);
  const [voteElectionId, setVoteElectionId] = useState<number | null>(null);
  const [selectedVotePositionId, setSelectedVotePositionId] = useState<number | ''>('');
  const [selectedVoteCandidateId, setSelectedVoteCandidateId] = useState<number | ''>('');
  const [auditElectionId, setAuditElectionId] = useState<number | null>(null);

  const canManage = hasAnyPermission(['elections.manage']);
  const canVote = hasAnyPermission(['elections.vote']);
  const canViewResults = hasAnyPermission(['elections.results']);

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['elections'],
    queryFn: () => electionApi.getElections(),
  });

  const { data: votePositions = [], isLoading: isVotePositionsLoading } = useQuery({
    queryKey: ['elections', 'vote-positions', voteElectionId],
    queryFn: () => electionApi.getPositions(voteElectionId as number),
    enabled: voteElectionId !== null,
  });

  const { data: voteCandidates = [], isLoading: isVoteCandidatesLoading } = useQuery({
    queryKey: ['elections', 'vote-candidates', selectedVotePositionId],
    queryFn: () => electionApi.getCandidates(Number(selectedVotePositionId)),
    enabled: voteElectionId !== null && selectedVotePositionId !== '',
  });

  const { data: votingLogs = [], isLoading: isVotingLogsLoading } = useQuery<VotingLogEntry[]>({
    queryKey: ['elections', 'voting-logs', auditElectionId],
    queryFn: () => electionApi.getVotingLogs(auditElectionId as number),
    enabled: auditElectionId !== null && canManage,
  });

  useEffect(() => {
    if (voteElectionId === null) {
      setSelectedVotePositionId('');
      setSelectedVoteCandidateId('');
      return;
    }

    if (
      votePositions.length > 0 &&
      (selectedVotePositionId === '' || !votePositions.some((p) => p.id === selectedVotePositionId))
    ) {
      setSelectedVotePositionId(votePositions[0].id);
    }
  }, [voteElectionId, votePositions, selectedVotePositionId]);

  useEffect(() => {
    setSelectedVoteCandidateId('');
  }, [selectedVotePositionId, voteElectionId]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((item) => item.title.toLowerCase().includes(q));
  }, [data, search]);

  const createMutation = useMutation({
    mutationFn: (dto: ElectionCreateRequestDto) => electionApi.createElection(dto),
    onSuccess: () => {
      toast.success('Election created');
      setShowCreateModal(false);
      queryClient.invalidateQueries({ queryKey: ['elections'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to create election'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ElectionUpdateRequestDto }) => electionApi.updateElection(id, dto),
    onSuccess: () => {
      toast.success('Election updated');
      setEditElection(null);
      queryClient.invalidateQueries({ queryKey: ['elections'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update election'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => electionApi.deleteElection(id),
    onSuccess: () => {
      toast.success('Election deleted');
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['elections'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to delete election'),
  });

  const addPositionMutation = useMutation({
    mutationFn: ({ electionId, dto }: { electionId: number; dto: PositionCreateRequestDto }) =>
      electionApi.addPosition(electionId, dto),
    onSuccess: async () => {
      toast.success('Position added');
      setShowPositionModal(false);
      if (manageElectionId) {
        const next = await electionApi.getPositions(manageElectionId);
        setPositions(next);
      }
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to add position'),
  });

  const addCandidateMutation = useMutation({
    mutationFn: ({ positionId, dto }: { positionId: number; dto: CandidateCreateRequestDto }) =>
      electionApi.addCandidate(positionId, dto),
    onSuccess: () => {
      toast.success('Candidate added');
      setShowCandidateModal(false);
      setSelectedPositionId(null);
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to add candidate'),
  });

  const voteMutation = useMutation({
    mutationFn: ({ electionId, candidateId }: { electionId: number; candidateId: number }) =>
      electionApi.castVote(electionId, { candidateId }),
    onSuccess: (_data, variables) => {
      toast.success('Vote recorded');
      setVoteElectionId(null);
      queryClient.invalidateQueries({ queryKey: ['elections', 'voting-logs', variables.electionId] });
      queryClient.invalidateQueries({ queryKey: ['elections', 'results', variables.electionId] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to cast vote'),
  });

  const columns: Column<ElectionListItem>[] = useMemo(
    () => [
      { key: 'title', label: 'Title', sortable: false },
      { key: 'startDate', label: 'Start', sortable: false },
      { key: 'endDate', label: 'End', sortable: false },
      { key: 'votingStart', label: 'Voting Start', sortable: false },
      { key: 'votingEnd', label: 'Voting End', sortable: false },
      { key: 'isPublished', label: 'Published', sortable: false, render: (v) => (v ? 'Yes' : 'No') },
      { key: 'isActive', label: 'Active', sortable: false, render: (v) => (v ? 'Yes' : 'No') },
    ],
    []
  );

  const rowActions: RowAction<ElectionListItem>[] = [
    {
      icon: Eye,
      label: 'Manage Positions',
      onClick: async (item) => {
        const nextPositions = await electionApi.getPositions(item.id);
        setPositions(nextPositions);
        setManageElectionId(item.id);
      },
      variant: 'secondary',
      show: () => canManage,
    },
    {
      icon: Eye,
      label: 'View Results',
      onClick: async (item) => {
        const result = await electionApi.getResults(item.id);
        setResultElection(result);
      },
      variant: 'secondary',
      show: () => canViewResults,
    },
    {
      icon: Eye,
      label: 'Audit Logs',
      onClick: (item) => setAuditElectionId(item.id),
      variant: 'secondary',
      show: () => canManage,
    },
    {
      icon: Vote,
      label: 'Vote',
      onClick: (item) => {
        setSelectedVotePositionId('');
        setSelectedVoteCandidateId('');
        setVoteElectionId(item.id);
      },
      variant: 'primary',
      show: () => canVote,
    },
    {
      icon: Pencil,
      label: 'Edit',
      onClick: async (item) => {
        const detail = await electionApi.getElectionById(item.id);
        setEditElection(detail);
      },
      variant: 'primary',
      show: () => canManage,
    },
    {
      icon: Trash2,
      label: 'Delete',
      onClick: (item) => setDeleteId(item.id),
      variant: 'danger',
      show: () => canManage,
    },
  ];

  const electionFields: FormField[] = [
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'startDate', label: 'Start Date', type: 'text', required: true, placeholder: 'YYYY-MM-DDTHH:mm:ss' },
    { name: 'endDate', label: 'End Date', type: 'text', required: true, placeholder: 'YYYY-MM-DDTHH:mm:ss' },
    { name: 'votingStart', label: 'Voting Start', type: 'text', required: true, placeholder: 'YYYY-MM-DDTHH:mm:ss' },
    { name: 'votingEnd', label: 'Voting End', type: 'text', required: true, placeholder: 'YYYY-MM-DDTHH:mm:ss' },
  ];

  const editFields: FormField[] = [
    { name: 'title', label: 'Title', type: 'text', defaultValue: editElection?.title || '' },
    { name: 'description', label: 'Description', type: 'textarea', defaultValue: editElection?.description || '' },
    { name: 'startDate', label: 'Start Date', type: 'text', defaultValue: editElection?.startDate || '' },
    { name: 'endDate', label: 'End Date', type: 'text', defaultValue: editElection?.endDate || '' },
    { name: 'votingStart', label: 'Voting Start', type: 'text', defaultValue: editElection?.votingStart || '' },
    { name: 'votingEnd', label: 'Voting End', type: 'text', defaultValue: editElection?.votingEnd || '' },
    { name: 'isPublished', label: 'Published', type: 'checkbox', defaultValue: editElection?.isPublished || false },
    { name: 'isActive', label: 'Active', type: 'checkbox', defaultValue: editElection?.isActive ?? true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Elections</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage elections, positions, candidates, voting and results.</p>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        error={error ? 'Failed to load elections' : undefined}
        searchPlaceholder="Search elections"
        onSearch={setSearch}
        actions={
          canManage
            ? {
                add: {
                  label: 'Create Election',
                  onClick: () => setShowCreateModal(true),
                },
              }
            : undefined
        }
        rowActions={rowActions}
      />

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Election">
        <DynamicForm
          fields={electionFields}
          onSubmit={(formData) => {
            const dto: ElectionCreateRequestDto = {
              title: formData.title,
              description: formData.description,
              startDate: formData.startDate,
              endDate: formData.endDate,
              votingStart: formData.votingStart,
              votingEnd: formData.votingEnd,
            };
            createMutation.mutate(dto);
          }}
          onCancel={() => setShowCreateModal(false)}
          submitLabel="Create"
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={Boolean(editElection)} onClose={() => setEditElection(null)} title="Edit Election">
        <DynamicForm
          fields={editFields}
          onSubmit={(formData) => {
            if (!editElection) return;
            const dto: ElectionUpdateRequestDto = {
              title: formData.title,
              description: formData.description,
              startDate: formData.startDate,
              endDate: formData.endDate,
              votingStart: formData.votingStart,
              votingEnd: formData.votingEnd,
              isPublished: Boolean(formData.isPublished),
              isActive: Boolean(formData.isActive),
            };
            updateMutation.mutate({ id: editElection.id, dto });
          }}
          onCancel={() => setEditElection(null)}
          submitLabel="Save"
          isLoading={updateMutation.isPending}
        />
      </Modal>

      <Modal isOpen={Boolean(manageElectionId)} onClose={() => setManageElectionId(null)} title="Manage Positions">
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowPositionModal(true)}
              className="px-3 py-1.5 text-xs rounded-lg bg-[#006A4E] text-white flex items-center gap-1"
            >
              <PlusCircle className="w-4 h-4" />
              Add Position
            </button>
          </div>
          {positions.length === 0 ? (
            <p className="text-sm text-gray-500">No positions added yet.</p>
          ) : (
            <div className="space-y-2">
              {positions.map((position) => (
                <div key={position.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm">
                  <div className="font-medium text-gray-900 dark:text-white">{position.name}</div>
                  <div className="text-gray-600 dark:text-gray-300">Max votes per user: {position.maxVotes}</div>
                  {position.description && <div className="text-gray-500 mt-1">{position.description}</div>}
                  <button
                    onClick={() => {
                      setSelectedPositionId(position.id);
                      setShowCandidateModal(true);
                    }}
                    className="mt-2 px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800"
                  >
                    Add Candidate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={showPositionModal} onClose={() => setShowPositionModal(false)} title="Add Position">
        <DynamicForm
          fields={[
            { name: 'name', label: 'Position Name', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'maxVotes', label: 'Max Votes Per User', type: 'number', defaultValue: 1, required: true },
          ]}
          onSubmit={(formData) => {
            if (!manageElectionId) return;
            addPositionMutation.mutate({
              electionId: manageElectionId,
              dto: {
                name: formData.name,
                description: formData.description,
                maxVotes: Number(formData.maxVotes) || 1,
              },
            });
          }}
          onCancel={() => setShowPositionModal(false)}
          submitLabel="Add"
          isLoading={addPositionMutation.isPending}
        />
      </Modal>

      <Modal isOpen={showCandidateModal} onClose={() => setShowCandidateModal(false)} title="Add Candidate">
        <DynamicForm
          fields={[
            { name: 'userId', label: 'User ID', type: 'number', required: true },
            { name: 'name', label: 'Candidate Name', type: 'text', required: true },
            { name: 'bio', label: 'Bio', type: 'textarea' },
            { name: 'manifesto', label: 'Manifesto', type: 'textarea' },
          ]}
          onSubmit={(formData) => {
            if (!selectedPositionId) return;
            addCandidateMutation.mutate({
              positionId: selectedPositionId,
              dto: {
                userId: Number(formData.userId),
                name: formData.name,
                bio: formData.bio,
                manifesto: formData.manifesto,
              },
            });
          }}
          onCancel={() => setShowCandidateModal(false)}
          submitLabel="Add"
          isLoading={addCandidateMutation.isPending}
        />
      </Modal>

      <Modal isOpen={Boolean(voteElectionId)} onClose={() => setVoteElectionId(null)} title="Cast Vote">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Position</label>
            <select
              value={selectedVotePositionId}
              onChange={(e) => setSelectedVotePositionId(Number(e.target.value) || '')}
              disabled={isVotePositionsLoading || voteMutation.isPending || votePositions.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">{isVotePositionsLoading ? 'Loading positions...' : 'Select Position'}</option>
              {votePositions.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.name} (max {position.maxVotes})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Candidate</label>
            <select
              value={selectedVoteCandidateId}
              onChange={(e) => setSelectedVoteCandidateId(Number(e.target.value) || '')}
              disabled={
                selectedVotePositionId === '' ||
                isVoteCandidatesLoading ||
                voteMutation.isPending ||
                voteCandidates.length === 0
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">{isVoteCandidatesLoading ? 'Loading candidates...' : 'Select Candidate'}</option>
              {voteCandidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </div>

          {selectedVotePositionId !== '' && !isVoteCandidatesLoading && voteCandidates.length === 0 && (
            <p className="text-sm text-amber-700 dark:text-amber-400">No candidates are available for this position.</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setVoteElectionId(null)}
              disabled={voteMutation.isPending}
              className="px-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!voteElectionId || selectedVoteCandidateId === '') {
                  toast.error('Please select a candidate');
                  return;
                }
                voteMutation.mutate({ electionId: voteElectionId, candidateId: Number(selectedVoteCandidateId) });
              }}
              disabled={voteMutation.isPending || selectedVoteCandidateId === ''}
              className="px-4 py-2 text-sm rounded-lg bg-[#006A4E] text-white disabled:opacity-50"
            >
              {voteMutation.isPending ? 'Submitting...' : 'Vote'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(auditElectionId)} onClose={() => setAuditElectionId(null)} title="Voting Audit Logs">
        {isVotingLogsLoading ? (
          <p className="text-sm text-gray-500">Loading logs...</p>
        ) : votingLogs.length === 0 ? (
          <p className="text-sm text-gray-500">No audit logs found for this election.</p>
        ) : (
          <div className="max-h-[420px] overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Time</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-300">User</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Action</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-300">Reason</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-300">IP</th>
                </tr>
              </thead>
              <tbody>
                {votingLogs.map((log) => (
                  <tr key={log.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {log.userEmail || `User #${log.userId}`}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{log.action}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{log.reason || '-'}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{log.ipAddress || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <Modal isOpen={Boolean(resultElection)} onClose={() => setResultElection(null)} title="Election Results">
        {resultElection && (
          <div className="space-y-3 text-sm">
            <div className="font-semibold text-gray-900 dark:text-white">{resultElection.electionTitle}</div>
            <div className="text-gray-600 dark:text-gray-300">Total votes: {resultElection.totalVotes}</div>
            {resultElection.positions.map((position) => (
              <div key={position.positionId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div className="font-medium text-gray-900 dark:text-white">{position.positionName}</div>
                <div className="mt-2 space-y-1">
                  {position.candidates.map((candidate) => (
                    <div key={candidate.candidateId} className="text-gray-700 dark:text-gray-300">
                      {candidate.candidateName}: {candidate.votes} vote(s), {candidate.percentage}%
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Delete Election"
        message="Are you sure you want to delete this election?"
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
