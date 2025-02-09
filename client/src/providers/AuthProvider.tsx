import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useLocation } from "wouter";

interface NotificationPreferences {
  email: {
    marketing: boolean;
    security: boolean;
    updates: boolean;
    newsletter: boolean;
  };
  inApp: {
    mentions: boolean;
    replies: boolean;
    directMessages: boolean;
    systemUpdates: boolean;
  };
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  isVerified: boolean;
  notificationPreferences: NotificationPreferences;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<{ message: string }>;
  requestPasswordReset: (email: string) => Promise<{ message: string }>;
  resetPassword: (token: string, password: string) => Promise<{ message: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ user: User }>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Auth check query
  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ["auth"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log('No token found, redirecting to login');
        setLocation('/auth');
        return null;
      }
      console.log('Token found, checking auth status');
      const { user } = await api.auth.me();
      console.log('Auth check successful:', user);
      return user;
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      console.log('Attempting login...');
      const response = await api.auth.login(data);
      localStorage.setItem("token", response.token);
      setLocation('/admin');
      return response;
    },
    onSuccess: async (response) => {
      console.log('Login successful, refreshing user data...');
      queryClient.setQueryData(["auth"], response.user);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.auth.logout();
      localStorage.removeItem("token");
      queryClient.clear();
    },
    onSuccess: () => {
      setLocation('/auth');
    },
  });

  // Email verification mutation
  const verifyEmailMutation = useMutation({
    mutationFn: async (token: string) => {
      return api.auth.verifyEmail(token);
    },
    onSuccess: () => {
      toast({
        title: "Email verified",
        description: "Your email has been verified successfully.",
      });
      refetch();
    },
  });

  // Password reset request mutation
  const requestPasswordResetMutation = useMutation({
    mutationFn: async (email: string) => {
      return api.auth.requestPasswordReset(email);
    },
    onSuccess: () => {
      toast({
        title: "Reset email sent",
        description: "Check your email for password reset instructions.",
      });
    },
  });

  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      return api.auth.resetPassword(token, password);
    },
    onSuccess: () => {
      toast({
        title: "Password reset",
        description: "Your password has been reset successfully.",
      });
      setLocation('/auth');
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      return api.auth.updateProfile(data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      refetch();
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isError,
        error,
        isAuthenticated: !!user,
        login: loginMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        verifyEmail: verifyEmailMutation.mutateAsync,
        requestPasswordReset: requestPasswordResetMutation.mutateAsync,
        resetPassword: (token: string, password: string) => 
          resetPasswordMutation.mutateAsync({ token, password }),
        updateProfile: updateProfileMutation.mutateAsync,
        isAdmin: user?.role === 'ADMIN'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
