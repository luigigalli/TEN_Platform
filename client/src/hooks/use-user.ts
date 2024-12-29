import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InsertUser, SelectUser } from "@db/schema";
import { useToast } from "@/hooks/use-toast";

// Types and Interfaces
interface UserError extends Error {
  code?: string;
  status?: number;
}

interface RequestSuccess {
  ok: true;
  message?: string;
  user?: SelectUser;
}

interface RequestFailure {
  ok: false;
  message: string;
  code?: string;
  status?: number;
}

type RequestResult = RequestSuccess | RequestFailure;

interface UseUserResult {
  user: SelectUser | null;
  isLoading: boolean;
  isError: boolean;
  error: UserError | null;
  login: (data: InsertUser) => Promise<RequestResult>;
  logout: () => Promise<RequestResult>;
  register: (data: InsertUser) => Promise<RequestResult>;
}

/**
 * Handle API requests with proper error handling
 * @param url - API endpoint URL
 * @param method - HTTP method
 * @param body - Request body (optional)
 * @returns Promise resolving to request result
 */
async function handleRequest(
  url: string,
  method: string,
  body?: InsertUser
): Promise<RequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { 
        "Content-Type": "application/json",
        "Accept": "application/json",
      } : {
        "Accept": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { 
        ok: false, 
        message: data.message || response.statusText,
        code: data.code || "request_failed",
        status: response.status,
      };
    }

    return { 
      ok: true,
      ...data,
    };
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    return { 
      ok: false, 
      message: error.message,
      code: "network_error",
      status: 0,
    };
  }
}

/**
 * Fetch user data with proper error handling
 * @returns Promise resolving to user data or null
 * @throws {UserError} If fetching fails
 */
async function fetchUser(): Promise<SelectUser | null> {
  try {
    const response = await fetch("/api/user", {
      credentials: "include",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }

      const data = await response.json().catch(() => ({}));
      const error = new Error(data.message || response.statusText) as UserError;
      error.code = data.code || "fetch_user_failed";
      error.status = response.status;
      throw error;
    }

    return response.json();
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Failed to fetch user");
    if (error instanceof UserError) {
      throw error;
    }
    const userError = error as UserError;
    userError.code = userError.code || "unknown_error";
    throw userError;
  }
}

/**
 * Hook for managing user authentication and data
 * @returns Object containing user data and authentication functions
 */
export function useUser(): UseUserResult {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { 
    data: user, 
    error,
    isLoading,
    isError,
  } = useQuery<SelectUser | null, UserError>({
    queryKey: ["user"],
    queryFn: fetchUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error.status === 401) return false;
      return failureCount < 3;
    },
  });

  const loginMutation = useMutation<RequestResult, UserError, InsertUser>({
    mutationFn: (userData) => handleRequest("/api/login", "POST", userData),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: ["user"] });
        if (result.user) {
          queryClient.setQueryData(["user"], result.user);
        }
        toast({
          title: "Success",
          description: result.message || "Logged in successfully!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: result.message,
        });
      }
    },
    onError: (error: UserError) => {
      toast({
        variant: "destructive",
        title: "Login Error",
        description: error.message,
      });
    },
  });

  const logoutMutation = useMutation<RequestResult, UserError>({
    mutationFn: () => handleRequest("/api/logout", "POST"),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.setQueryData(["user"], null);
        queryClient.invalidateQueries({ queryKey: ["user"] });
        toast({
          title: "Success",
          description: result.message || "Logged out successfully!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Logout Failed",
          description: result.message,
        });
      }
    },
    onError: (error: UserError) => {
      toast({
        variant: "destructive",
        title: "Logout Error",
        description: error.message,
      });
    },
  });

  const registerMutation = useMutation<RequestResult, UserError, InsertUser>({
    mutationFn: (userData) => handleRequest("/api/register", "POST", userData),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: ["user"] });
        if (result.user) {
          queryClient.setQueryData(["user"], result.user);
        }
        toast({
          title: "Success",
          description: result.message || "Account created successfully!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: result.message,
        });
      }
    },
    onError: (error: UserError) => {
      toast({
        variant: "destructive",
        title: "Registration Error",
        description: error.message,
      });
    },
  });

  return {
    user,
    isLoading,
    isError,
    error: error ?? null,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}