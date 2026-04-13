import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissionGuard } from '../../core/guards/permission.guard';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { UsersPage } from '../../features/users/pages/UsersPage';
import { ActivityLogPage } from '../../features/activity/pages/ActivityLogPage';
import { PreferencesPage } from '../../features/preferences/pages/PreferencesPage';
import { SettingsLayout } from '../../features/settings/pages/SettingsLayout';
import { ReportsPage } from '../../features/reports/pages/ReportsPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
    ],
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <DashboardLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: 'dashboard',
        element: (
          <PermissionGuard permissions={['dashboard.view']}>
            <DashboardPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'users',
        element: (
          <PermissionGuard permissions={['users.view']}>
            <UsersPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'reports',
        element: (
          <PermissionGuard permissions={['reports.view']}>
            <ReportsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'activity',
        element: (
          <PermissionGuard permissions={['dashboard.view']}>
            <ActivityLogPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'preferences',
        element: <PreferencesPage />,
      },
      {
        path: 'settings/general',
        element: (
          <PermissionGuard permissions={['settings.view']}>
            <SettingsLayout initialTab="general" />
          </PermissionGuard>
        ),
      },
      {
        path: 'settings/security',
        element: (
          <PermissionGuard permissions={['settings.view']}>
            <SettingsLayout initialTab="security" />
          </PermissionGuard>
        ),
      },
      {
        path: 'settings/notifications',
        element: (
          <PermissionGuard permissions={['settings.view']}>
            <SettingsLayout initialTab="notifications" />
          </PermissionGuard>
        ),
      },
    ],
  },
  {
    path: '/403',
    element: <ForbiddenPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
