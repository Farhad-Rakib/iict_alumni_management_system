import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { toast } from '../../components/ui/Toast/toast.store';

interface PermissionGuardProps {
  children: React.ReactNode;
  permissions: string[];
  requireAll?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permissions,
  requireAll = false,
}) => {
  const { hasAllPermissions, hasAnyPermission } = useAuthStore();

  const hasAccess = requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  useEffect(() => {
    if (!hasAccess) {
      toast.warning('You do not have permission to access that page.');
    }
  }, [hasAccess]);

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
