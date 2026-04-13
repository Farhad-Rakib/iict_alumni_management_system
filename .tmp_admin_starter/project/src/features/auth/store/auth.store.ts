import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../../../domain/models/user.model';
import { LoginRequestDto } from '../../../domain/dto/auth.dto';
import { authApi } from '../../../core/api/services/auth.api';
import { AppConfig } from '../../../core/config/app.config';

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
}

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
        return user.permissions.includes(permission);
      },

      hasAnyPermission: (permissions: string[]): boolean => {
        const { user } = get();
        if (!user) return false;
        return permissions.some(permission => user.permissions.includes(permission));
      },

      hasAllPermissions: (permissions: string[]): boolean => {
        const { user } = get();
        if (!user) return false;
        return permissions.every(permission => user.permissions.includes(permission));
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
