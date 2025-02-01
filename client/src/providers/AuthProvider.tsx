import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useLocation } from "wouter";

interface Role {
  id: string;
  name: string;
  description: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  roles: Role[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  login: (data: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ["auth"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log('No token found, redirecting to login');
          setLocation('/auth');
          return null;
        }

        console.log('Token found, checking auth status');
        const response = await api.auth.me();
        if (!response.user) {
          console.log('No user data returned, clearing token');
          localStorage.removeItem("token");
          setLocation('/auth');
          return null;
        }
        console.log('Auth check successful:', response.user);
        return response.user;
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem("token");
        setLocation('/auth');
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });

  // Handle initial page load and redirects
  useEffect(() => {
    if (!isLoading) {
      setIsInitialLoad(false);
      const currentPath = window.location.pathname;
      
      if (!user) {
        // Only redirect to auth if we're not already there
        if (currentPath !== '/auth') {
          console.log('No user, redirecting to login');
          setLocation('/auth');
        }
      } else {
        // Handle redirects for authenticated users
        if (currentPath === '/auth' || currentPath === '/') {
          if (user.roles.some((role) => role.name.toUpperCase() === "ADMIN")) {
            setLocation("/admin");
          } else {
            setLocation("/profile/" + user.id);
          }
        }
      }
    }
  }, [isLoading, user, setLocation]);

  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      console.log('Attempting login...');
      const response = await api.auth.login(data.username, data.password);
      if (!response.token) {
        throw new Error('No token received from server');
      }
      localStorage.setItem("token", response.token);
      console.log('Token found, checking auth status');
      await refetch();
      console.log('Login successful, redirecting...');
    },
    onError: (error) => {
      console.error('Login failed:', error);
      localStorage.removeItem("token");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to login",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await api.auth.logout();
      } catch (error) {
        console.error('Logout API call failed:', error);
      } finally {
        localStorage.removeItem("token");
        queryClient.setQueryData(["auth"], null);
        setLocation("/auth");
      }
    },
  });

  const value = {
    user,
    isLoading,
    isError,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isAdmin: user?.roles.some((role) => role.name.toUpperCase() === "ADMIN") ?? false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
