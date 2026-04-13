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
import { GeneralSettingsPage } from '../../features/settings/pages/GeneralSettingsPage';
import { SecuritySettingsPage } from '../../features/settings/pages/SecuritySettingsPage';
import { NotificationSettingsPage } from '../../features/settings/pages/NotificationSettingsPage';
import { RBACPage } from '../../features/rbac/pages/RBACPage';
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
          <PermissionGuard permissions={['activity.view']}>
            <ActivityLogPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'preferences',
        element: (
          <PermissionGuard permissions={['dashboard.view']}>
            <PreferencesPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'settings/general',
        element: (
          <PermissionGuard permissions={['settings.view']}>
            <GeneralSettingsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'settings/security',
        element: (
          <PermissionGuard permissions={['settings.view']}>
            <SecuritySettingsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'settings/notifications',
        element: (
          <PermissionGuard permissions={['settings.view']}>
            <NotificationSettingsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'settings/rbac',
        element: (
          <PermissionGuard permissions={[
            'rbac.manage',
            'rbac.permissions.view',
            'rbac.roles.view',
            'rbac.users.view',
            'rbac.role_permissions.view',
            'rbac.user_roles.view',
            'rbac.user_permissions.view',
          ]}>
            <RBACPage />
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
