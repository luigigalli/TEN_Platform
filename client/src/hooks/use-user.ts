import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InsertUser, SelectUser } from "@db/schema";

type RequestResult = {
  ok: true;
  message?: string;
  user?: SelectUser;
} | {
  ok: false;
  message: string;
};

async function handleRequest(
  url: string,
  method: string,
  body?: InsertUser
): Promise<RequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        ok: false, 
        message: data.message || response.statusText 
      };
    }

    return { 
      ok: true,
      ...data
    };
  } catch (e: any) {
    return { 
      ok: false, 
      message: e.toString() 
    };
  }
}

async function fetchUser(): Promise<SelectUser | null> {
  try {
    const response = await fetch("/api/user", {
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      const data = await response.json();
      throw new Error(data.message || response.statusText);
    }

    return response.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch user");
  }
}

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading } = useQuery<SelectUser | null, Error>({
    queryKey: ["user"],
    queryFn: fetchUser,
    staleTime: Infinity,
    retry: false,
  });

  const loginMutation = useMutation<RequestResult, Error, InsertUser>({
    mutationFn: (userData) => handleRequest("/api/login", "POST", userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const logoutMutation = useMutation<RequestResult, Error>({
    mutationFn: () => handleRequest("/api/logout", "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const registerMutation = useMutation<RequestResult, Error, InsertUser>({
    mutationFn: (userData) => handleRequest("/api/register", "POST", userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}