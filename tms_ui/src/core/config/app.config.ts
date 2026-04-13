export const AppConfig = {
  app: {
    name: 'BUET Alumni Portal',
    version: '1.0.0',
    description: 'Alumni management and engagement console',
    logo: '/logo.svg',
  },

  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
    timeout: 30000,
    withCredentials: false,
    useMockData: false,
    mockDelay: 800,
  },

  auth: {
    tokenKey: 'alumni_token',
    userKey: 'alumni_user',
    storageType: 'localStorage' as 'localStorage' | 'sessionStorage',
    loginPath: '/login',
    defaultRedirect: '/dashboard',
    sessionTimeout: 60 * 60 * 1000,
  },

  theme: {
    primary: '#006A4E',
    secondary: '#C1272D',
    success: '#2E7D32',
    warning: '#D97706',
    error: '#C1272D',
    info: '#1D4ED8',
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
