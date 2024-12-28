import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InsertUser, SelectUser } from "@db/schema";
import { useToast } from "@/hooks/use-toast";

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
    console.log(`Making ${method} request to ${url}`);
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    const data = await response.json();
    console.log(`Response from ${url}:`, data);

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
    console.error(`Error in ${method} request to ${url}:`, e);
    return { 
      ok: false, 
      message: e.toString() 
    };
  }
}

async function fetchUser(): Promise<SelectUser | null> {
  try {
    console.log('Fetching user data...');
    const response = await fetch("/api/user", {
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log('User not authenticated');
        return null;
      }
      const data = await response.json();
      throw new Error(data.message || response.statusText);
    }

    const userData = await response.json();
    console.log('User data fetched:', userData);
    return userData;
  } catch (error: any) {
    console.error('Error fetching user:', error);
    throw new Error(error.message || "Failed to fetch user");
  }
}

export function useUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, error, isLoading } = useQuery<SelectUser | null, Error>({
    queryKey: ["user"],
    queryFn: fetchUser,
    staleTime: Infinity,
    retry: false,
  });

  const loginMutation = useMutation<RequestResult, Error, InsertUser>({
    mutationFn: (userData) => handleRequest("/api/login", "POST", userData),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: ["user"] });
        toast({
          title: "Success",
          description: result.message || "Logged in successfully!"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: result.message
        });
      }
    },
  });

  const logoutMutation = useMutation<RequestResult, Error>({
    mutationFn: () => handleRequest("/api/logout", "POST"),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.setQueryData(["user"], null);
        queryClient.invalidateQueries({ queryKey: ["user"] });
        toast({
          title: "Success",
          description: result.message || "Logged out successfully!"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Logout Failed",
          description: result.message
        });
      }
    },
  });

  const registerMutation = useMutation<RequestResult, Error, InsertUser>({
    mutationFn: (userData) => handleRequest("/api/register", "POST", userData),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: ["user"] });
        toast({
          title: "Success",
          description: result.message || "Account created successfully!"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: result.message
        });
      }
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