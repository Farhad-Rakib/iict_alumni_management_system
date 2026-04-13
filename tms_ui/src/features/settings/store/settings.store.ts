import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  timezone: string;
  dateFormat: string;
  language: string;
  maintenanceMode: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: string;
  maxLoginAttempts: string;
  passwordMinLength: string;
  requireSpecialChars: boolean;
  requireUppercase: boolean;
  ipWhitelist: string;
  auditLogRetention: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  newUserAlert: boolean;
  securityAlert: boolean;
  systemUpdateAlert: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
}

export interface SettingsState {
  general: GeneralSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  lastSaved: string | null;
  updateGeneral: (data: Partial<GeneralSettings>) => void;
  updateSecurity: (data: Partial<SecuritySettings>) => void;
  updateNotifications: (data: Partial<NotificationSettings>) => void;
  hydrateSection: (
    section: 'general' | 'security' | 'notifications',
    data: Partial<GeneralSettings | SecuritySettings | NotificationSettings>,
    savedAt?: string | null
  ) => void;
  exportAsJSON: () => string;
}

const defaultGeneral: GeneralSettings = {
  siteName: 'BUET Alumni Portal',
  siteDescription: 'Alumni management and engagement platform',
  supportEmail: 'support@alumni.buet.ac.bd',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  language: 'en',
  maintenanceMode: false,
};

const defaultSecurity: SecuritySettings = {
  twoFactorAuth: false,
  sessionTimeout: '60',
  maxLoginAttempts: '5',
  passwordMinLength: '8',
  requireSpecialChars: true,
  requireUppercase: true,
  ipWhitelist: '',
  auditLogRetention: '90',
};

const defaultNotifications: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  newUserAlert: true,
  securityAlert: true,
  systemUpdateAlert: false,
  weeklyReport: true,
  monthlyReport: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      general: defaultGeneral,
      security: defaultSecurity,
      notifications: defaultNotifications,
      lastSaved: null,

      updateGeneral: (data) => set((s) => ({
        general: { ...s.general, ...data },
        lastSaved: new Date().toISOString(),
      })),

      updateSecurity: (data) => set((s) => ({
        security: { ...s.security, ...data },
        lastSaved: new Date().toISOString(),
      })),

      updateNotifications: (data) => set((s) => ({
        notifications: { ...s.notifications, ...data },
        lastSaved: new Date().toISOString(),
      })),

      hydrateSection: (section, data, savedAt) =>
        set((s) => ({
          ...s,
          [section]: {
            ...s[section],
            ...data,
          },
          lastSaved: savedAt ?? s.lastSaved,
        } as SettingsState)),

      exportAsJSON: () => {
        const { general, security, notifications } = get();
        return JSON.stringify({ general, security, notifications }, null, 2);
      },
    }),
    { name: 'alumni_settings' }
  )
);
