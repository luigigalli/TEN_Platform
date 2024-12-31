import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InsertUser, SelectUser } from "@db/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Validation schemas
const userErrorSchema = z.object({
  name: z.literal('UserError'),
  message: z.string(),
  code: z.string().optional(),
  status: z.number().optional(),
});

const requestSuccessSchema = z.object({
  ok: z.literal(true),
  message: z.string().optional(),
  user: z.custom<SelectUser>().optional(),
});

const requestFailureSchema = z.object({
  ok: z.literal(false),
  message: z.string(),
  code: z.string().optional(),
  status: z.number().optional(),
});

const requestResultSchema = z.discriminatedUnion('ok', [
  requestSuccessSchema,
  requestFailureSchema,
]);

type UserError = z.infer<typeof userErrorSchema>;
type RequestSuccess = z.infer<typeof requestSuccessSchema>;
type RequestFailure = z.infer<typeof requestFailureSchema>;
type RequestResult = z.infer<typeof requestResultSchema>;

interface UseUserResult {
  readonly user: SelectUser | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: UserError | null;
  readonly login: (data: InsertUser) => Promise<RequestResult>;
  readonly logout: () => Promise<RequestResult>;
  readonly register: (data: InsertUser) => Promise<RequestResult>;
}

class UserError extends Error {
  readonly code?: string;
  readonly status?: number;

  constructor(message: string, details?: { code?: string; status?: number }) {
    super(message);
    this.name = 'UserError';
    
    if (details) {
      try {
        const validatedDetails = userErrorSchema.parse({
          name: 'UserError',
          message,
          ...details,
        });
        this.code = validatedDetails.code;
        this.status = validatedDetails.status;
      } catch (error) {
        console.error('Invalid user error details:', error);
      }
    }

    // Make properties immutable
    Object.freeze(this);
  }

  static fromResponse(response: Response, data: any): UserError {
    return new UserError(
      data.message || 'Request failed',
      {
        code: data.code,
        status: response.status,
      }
    );
  }

  static fromError(error: unknown): UserError {
    if (error instanceof UserError) {
      return error;
    }
    return new UserError(error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Validates request result
 * @param result - Result to validate
 * @throws {UserError} If result is invalid
 */
function validateRequestResult(result: unknown): RequestResult {
  try {
    return requestResultSchema.parse(result);
  } catch (error) {
    throw new UserError('Invalid response format');
  }
}

/**
 * Handle API requests with proper error handling
 * @param url - API endpoint URL
 * @param method - HTTP method
 * @param body - Request body (optional)
 * @returns Promise resolving to request result
 * @throws {UserError} If request fails
 */
async function handleRequest(
  url: string,
  method: string,
  body?: InsertUser
): Promise<RequestResult> {
  try {
    console.log(`[FRONTEND] Making ${method} request to ${url}`);
    if (body) {
      console.log('[FRONTEND] Request body:', JSON.stringify(body, null, 2));
    }

    const response = await fetch(`/api/user${url}`, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    console.log(`[FRONTEND] Response status: ${response.status}`);
    
    let data;
    try {
      const text = await response.text();
      console.log('[FRONTEND] Raw response:', text);
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('[FRONTEND] Failed to parse response:', e);
      throw new UserError('Invalid response format');
    }

    if (!response.ok) {
      console.error('[FRONTEND] Request failed:', data);
      throw UserError.fromResponse(response, data);
    }

    return validateRequestResult(data);
  } catch (error) {
    console.error('[FRONTEND] Request error:', error);
    throw UserError.fromError(error);
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
      credentials: "include"
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw UserError.fromResponse(response, data);
    }

    const userData = await response.json();
    return userData === null ? null : userData as SelectUser;
  } catch (err) {
    if (err instanceof UserError && err.status === 401) {
      return null;
    }
    throw UserError.fromError(err);
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
      // Don't retry on 401s
      if (error.status === 401) return false;
      return failureCount < 3;
    },
    // Force refetch on window focus
    refetchOnWindowFocus: true,
  });

  const loginMutation = useMutation<RequestResult, UserError, InsertUser>({
    mutationFn: (userData) => handleRequest("/login", "POST", userData),
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
    mutationFn: () => handleRequest("/logout", "POST"),
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
    mutationFn: (userData) => handleRequest("/register", "POST", userData),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: ["user"] });
        if (result.user) {
          queryClient.setQueryData(["user"], result.user);
        }
        toast({
          title: "Success",
          description: result.message || "Registered successfully!",
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
    user: user ?? null,
    isLoading,
    isError,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}