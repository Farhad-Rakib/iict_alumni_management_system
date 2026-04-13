import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, ChevronsUpDown, Plus } from 'lucide-react';
import { Loader } from '../ui/Loader/Loader';
import { EmptyState } from '../ui/EmptyState/EmptyState';
import { ErrorState } from '../ui/ErrorState/ErrorState';

export interface RowAction<T> {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: (row: T) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  show?: (row: T) => boolean;
}

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  error?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (term: string) => void;
  sortable?: boolean;
  onSort?: (key: keyof T, order: 'asc' | 'desc') => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  emptyState?: {
    title: string;
    description?: string;
  };
  actions?: {
    add?: {
      label: string;
      onClick: () => void;
    };
    custom?: Array<{
      label: string;
      onClick: () => void;
      variant?: 'primary' | 'secondary';
    }>;
  };
  rowActions?: RowAction<T>[];
  onRetry?: () => void;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading,
  error,
  searchable = true,
  searchPlaceholder = 'Search...',
  onSearch,
  sortable = true,
  onSort,
  pagination,
  emptyState,
  actions,
  rowActions,
  onRetry,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    order: 'asc' | 'desc';
  }>({ key: null, order: 'asc' });

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    onSearch?.(term);
  };

  const handleSort = (key: keyof T) => {
    if (!sortable) return;

    const newOrder =
      sortConfig.key === key && sortConfig.order === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, order: newOrder });
    onSort?.(key, newOrder);
  };

  const getSortIcon = (columnKey: keyof T | string) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.order === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-[#006A4E]" />
    ) : (
      <ChevronDown className="w-4 h-4 text-[#006A4E]" />
    );
  };

  if (error) {
    return <ErrorState message={error} retry={onRetry} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {searchable && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006A4E]"
            />
          </div>
        )}

        {(actions?.custom?.length || actions?.add) && (
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
            {actions?.custom?.map((action, idx) => (
              <button
                key={`${action.label}-${idx}`}
                onClick={action.onClick}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg transition-colors ${
                  action.variant === 'primary'
                    ? 'bg-[#006A4E] text-white hover:bg-[#00553f]'
                    : 'bg-white border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {action.label}
              </button>
            ))}

            {actions?.add && (
              <button
                onClick={actions.add.onClick}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#006A4E] text-white rounded-lg hover:bg-[#00553f] transition-colors"
              >
                <Plus className="w-4 h-4" />
                {actions.add.label}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                      column.sortable !== false && sortable
                        ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700'
                        : ''
                    }`}
                    style={{ width: column.width }}
                    onClick={() =>
                      column.sortable !== false && sortable && handleSort(column.key as keyof T)
                    }
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable !== false && sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
                {rowActions && rowActions.length > 0 && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + (rowActions && rowActions.length > 0 ? 1 : 0)}>
                    <Loader />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (rowActions && rowActions.length > 0 ? 1 : 0)}>
                    <EmptyState
                      title={emptyState?.title || 'No data found'}
                      description={emptyState?.description}
                    />
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                      >
                        {column.render
                          ? column.render(row[column.key as keyof T], row)
                          : String(row[column.key as keyof T] || '')}
                      </td>
                    ))}
                    {rowActions && rowActions.length > 0 && (
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          {rowActions
                            .filter((action) => !action.show || action.show(row))
                            .map((action, idx) => {
                              const Icon = action.icon;
                              const variantStyles = {
                                primary: 'text-[#006A4E] hover:bg-[#E8F4F0] dark:hover:bg-emerald-900/20',
                                secondary: 'text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800',
                                danger: 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
                                success: 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20',
                                warning: 'text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
                              };
                              return (
                                <button
                                  key={idx}
                                  onClick={() => action.onClick(row)}
                                  className={`p-2 rounded transition-colors ${
                                    variantStyles[action.variant || 'secondary']
                                  }`}
                                  title={action.label}
                                >
                                  <Icon className="w-4 h-4" />
                                </button>
                              );
                            })}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && data.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-700 dark:text-gray-300">Rows per page:</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-2 justify-between md:justify-end flex-wrap">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
