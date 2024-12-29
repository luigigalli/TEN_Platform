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
      data?.message || response.statusText,
      {
        code: data?.code || 'request_failed',
        status: response.status,
      }
    );
  }

  static fromError(error: unknown): UserError {
    if (error instanceof UserError) {
      return error;
    }
    return new UserError(
      error instanceof Error ? error.message : 'Unknown error',
      { code: 'unknown_error', status: 0 }
    );
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
    throw new UserError(
      'Invalid request result',
      { code: 'validation_error', status: 500 }
    );
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
      return validateRequestResult({ 
        ok: false, 
        message: data.message || response.statusText,
        code: data.code || "request_failed",
        status: response.status,
      });
    }

    return validateRequestResult({ 
      ok: true,
      ...data,
    });
  } catch (err) {
    const error = UserError.fromError(err);
    return validateRequestResult({ 
      ok: false, 
      message: error.message,
      code: error.code || "network_error",
      status: error.status || 0,
    });
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
      throw UserError.fromResponse(response, data);
    }

    const userData = await response.json();
    return userData;
  } catch (err) {
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

  return Object.freeze({
    user,
    isLoading,
    isError,
    error: error ?? null,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  });
}