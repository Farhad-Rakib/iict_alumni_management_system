import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '../../../domain/models/user.model';
import { LoginRequestDto } from '../../../domain/dto/auth.dto';
import { authApi } from '../../../core/api/services/auth.api';
import { AppConfig } from '../../../core/config/app.config';
import { queryClient } from '../../../core/query/queryClient';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (dto: LoginRequestDto) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (...roles: UserRole[]) => boolean;
}

const normalizePermission = (permission: string): string => {
  if (!permission.includes('.')) return permission;
  const parts = permission.split('.');
  const actionMap: Record<string, string> = {
    add: 'create',
    create: 'create',
    view: 'read',
    read: 'read',
    edit: 'update',
    update: 'update',
    delete: 'delete',
  };

  if (parts.length === 2) {
    const [resource, action] = parts;
    return `${resource}.${actionMap[action] || action}`;
  }

  const prefix = parts.slice(0, -1).join('.');
  const last = parts[parts.length - 1];
  return `${prefix}.${actionMap[last] || last}`;
};

const normalizeSet = (permissions: string[]): Set<string> => {
  const values = new Set<string>(permissions);
  for (const permission of permissions) {
    values.add(normalizePermission(permission));
  }
  return values;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (dto: LoginRequestDto) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(dto);
          queryClient.clear();
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Login failed',
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          queryClient.clear();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      clearError: () => set({ error: null }),

      hasPermission: (permission: string): boolean => {
        const { user } = get();
        if (!user) return false;
        const normalized = normalizeSet(user.permissions);
        if (normalized.has('*')) return true;
        return normalized.has(permission) || normalized.has(normalizePermission(permission));
      },

      hasAnyPermission: (permissions: string[]): boolean => {
        const { user } = get();
        if (!user) return false;
        const normalized = normalizeSet(user.permissions);
        if (normalized.has('*')) return true;
        return permissions.some(permission => normalized.has(permission) || normalized.has(normalizePermission(permission)));
      },

      hasAllPermissions: (permissions: string[]): boolean => {
        const { user } = get();
        if (!user) return false;
        const normalized = normalizeSet(user.permissions);
        if (normalized.has('*')) return true;
        return permissions.every(permission => normalized.has(permission) || normalized.has(normalizePermission(permission)));
      },

      hasRole: (...roles: UserRole[]): boolean => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role);
      },
    }),
    {
      name: AppConfig.auth.tokenKey,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
