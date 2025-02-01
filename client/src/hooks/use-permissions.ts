import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../providers/AuthProvider';

export function usePermissions() {
  const { user } = useAuth();

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const response = await api.auth.getUserPermissions(user.id);
      console.log('Permissions response:', response);
      return response.permissions;
    },
    enabled: !!user,
  });

  const hasPermission = (permission: string) => {
    console.log('Checking permission:', permission, 'against permissions:', permissions);
    return permissions.includes(permission);
  };

  const canViewUserFinancials = () => {
    const can = hasPermission('users.financials:read');
    console.log('Can view financials:', can);
    return can;
  };

  const canEditUserFinancials = () => {
    const can = hasPermission('users.financials:update');
    console.log('Can edit financials:', can);
    return can;
  };

  return {
    permissions,
    hasPermission,
    canViewUserFinancials,
    canEditUserFinancials,
  };
}
