import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissionGuard } from '../../core/guards/permission.guard';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { VerifyOtpPage } from '../../features/auth/pages/VerifyOtpPage';
import { SetPasswordPage } from '../../features/auth/pages/SetPasswordPage';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { UsersPage } from '../../features/users/pages/UsersPage';
import { ActivityLogPage } from '../../features/activity/pages/ActivityLogPage';
import { PreferencesPage } from '../../features/preferences/pages/PreferencesPage';
import { GeneralSettingsPage } from '../../features/settings/pages/GeneralSettingsPage';
import { SecuritySettingsPage } from '../../features/settings/pages/SecuritySettingsPage';
import { NotificationSettingsPage } from '../../features/settings/pages/NotificationSettingsPage';
import { RBACPage } from '../../features/rbac/pages/RBACPage';
import { ReportsPage } from '../../features/reports/pages/ReportsPage';
import { JobsPage } from '../../features/jobs/pages/JobsPage';
import { EventsPage } from '../../features/events/pages/EventsPage';
import { ElectionsPage } from '../../features/elections/pages/ElectionsPage';
import { CMSPage } from '../../features/cms/pages/CMSPage';
import { AlumniPage } from '../../features/alumni/pages/AlumniPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { AppConfig } from '../../core/config/app.config';


const RootRedirect: React.FC = () => {
  const { isAuthenticated, hasAnyPermission } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to={AppConfig.auth.loginPath} replace />;
  }

  if (hasAnyPermission(['dashboard.view', 'dashboard.read'])) {
    return <Navigate to="/dashboard" replace />;
  }
  if (hasAnyPermission(['users.view', 'users.read'])) {
    return <Navigate to="/users" replace />;
  }
  if (hasAnyPermission(['alumni.view', 'alumni.read'])) {
    return <Navigate to="/alumni" replace />;
  }
  if (hasAnyPermission(['jobs.read', 'jobs.view'])) {
    return <Navigate to="/jobs" replace />;
  }
  if (hasAnyPermission(['events.read', 'events.view'])) {
    return <Navigate to="/events" replace />;
  }
  if (hasAnyPermission(['elections.read', 'elections.view'])) {
    return <Navigate to="/elections" replace />;
  }
  if (hasAnyPermission(['cms.manage'])) {
    return <Navigate to="/settings/cms?section=pages" replace />;
  }

  return <Navigate to="/403" replace />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'verify',
        element: <VerifyOtpPage />,
      },
      {
        path: 'set-password',
        element: <SetPasswordPage />,
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
        path: 'alumni',
        element: (
          <PermissionGuard permissions={['alumni.read']}>
            <AlumniPage />
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
        path: 'jobs',
        element: (
          <PermissionGuard permissions={['jobs.read']}>
            <JobsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'events',
        element: (
          <PermissionGuard permissions={['events.read']}>
            <EventsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'elections',
        element: (
          <PermissionGuard permissions={['elections.view']}>
            <ElectionsPage />
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
      {
        path: 'settings/cms',
        element: (
          <PermissionGuard permissions={['cms.manage']}>
            <CMSPage />
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
