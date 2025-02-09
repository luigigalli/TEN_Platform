import { useQuery } from "@tanstack/react-query";
import { UserRole, SensitiveOperation } from "@/types/user";

interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

export function useCurrentUser() {
  const { data: user, isLoading, error } = useQuery<CurrentUser>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) throw new Error('Failed to fetch current user');
      return response.json();
    },
  });

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isAdmin = isSuperAdmin || user?.role === UserRole.ADMIN;

  const can = (permission: string) => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return user.permissions.includes(permission);
  };

  const canPerformSensitiveOperation = (operation: SensitiveOperation) => {
    return isSuperAdmin;
  };

  return {
    user,
    isLoading,
    error,
    isSuperAdmin,
    isAdmin,
    can,
    canPerformSensitiveOperation,
  };
}
