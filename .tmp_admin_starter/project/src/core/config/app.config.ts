export const AppConfig = {
  app: {
    name: 'Admin Template',
    version: '1.0.0',
    description: 'Production-ready Admin Template Starter Kit',
    logo: '/logo.svg',
  },

  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
    timeout: 30000,
    withCredentials: false,
    useMockData: true,
    mockDelay: 800,
  },

  auth: {
    tokenKey: 'admin_token',
    userKey: 'admin_user',
    storageType: 'localStorage' as 'localStorage' | 'sessionStorage',
    loginPath: '/login',
    defaultRedirect: '/dashboard',
    sessionTimeout: 60 * 60 * 1000,
  },

  theme: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
  },

  features: {
    enableNotifications: true,
    enableDarkMode: true,
    enableMultiLanguage: false,
    enableRBAC: true,
  },

  table: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50, 100],
    showPagination: true,
    showSearch: true,
  },

  form: {
    showRequiredIndicator: true,
    validateOnBlur: true,
    validateOnChange: false,
  },

  menu: {
    loadFromJSON: true,
    collapsible: true,
    defaultCollapsed: false,
  },

  toast: {
    position: 'top-right' as const,
    duration: 3000,
    maxToasts: 5,
  },
} as const;

export type AppConfigType = typeof AppConfig;
