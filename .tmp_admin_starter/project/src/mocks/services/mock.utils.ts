import { AppConfig } from '../../core/config/app.config';
import { PaginatedResponse } from '../../core/api/http.types';

export const delay = (ms: number = AppConfig.api.mockDelay): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const mockResponse = async <T>(data: T, options?: { delay?: number; error?: boolean; errorMessage?: string }): Promise<T> => {
  await delay(options?.delay);

  if (options?.error) {
    throw new Error(options.errorMessage || 'Mock error occurred');
  }

  return data;
};

export const paginate = <T>(data: T[], page: number, pageSize: number): PaginatedResponse<T> => {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: data.slice(start, end),
    total: data.length,
    page,
    pageSize,
    totalPages: Math.ceil(data.length / pageSize),
  };
};

export const searchData = <T extends Record<string, any>>(
  data: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
): T[] => {
  if (!searchTerm) return data;

  const lowerSearch = searchTerm.toLowerCase();
  return data.filter(item =>
    searchFields.some(field => {
      const value = item[field];
      return value && String(value).toLowerCase().includes(lowerSearch);
    })
  );
};

export const sortData = <T extends Record<string, any>>(
  data: T[],
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): T[] => {
  if (!sortBy) return data;

  return [...data].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
};
