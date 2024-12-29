import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Service, InsertService } from "@db/schema";

interface ServiceError extends Error {
  code?: string;
  status?: number;
  message: string;
}

interface ServiceResponse {
  service: Service;
  message: string;
}

interface UseServicesResult {
  services: Service[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: ServiceError | null;
  createService: (serviceData: InsertService) => Promise<ServiceResponse>;
}

/**
 * Hook for managing services
 * @returns Object containing services data and management functions
 */
export function useServices(): UseServicesResult {
  const queryClient = useQueryClient();

  const { 
    data: services, 
    isLoading, 
    isError,
    error,
  } = useQuery<Service[], ServiceError>({
    queryKey: ["/api/services"],
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createService = useMutation<ServiceResponse, ServiceError, InsertService>({
    mutationFn: async (serviceData: InsertService) => {
      try {
        const res = await fetch("/api/services", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(serviceData),
          credentials: "include",
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          const error = new Error(
            errorData?.message || "Failed to create service"
          ) as ServiceError;
          error.status = res.status;
          error.code = errorData?.code || "create_service_failed";
          throw error;
        }

        const data = await res.json();
        return {
          service: data,
          message: "Service created successfully",
        };
      } catch (err) {
        if (err instanceof Error) {
          const serviceError = err as ServiceError;
          serviceError.code = serviceError.code || "unknown_error";
          throw serviceError;
        }
        throw new Error("An unknown error occurred");
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      queryClient.setQueryData<Service[]>(["/api/services"], (old) => {
        if (!old) return [data.service];
        return [...old, data.service];
      });
    },
    onError: (error: ServiceError) => {
      console.error("Failed to create service:", {
        message: error.message,
        code: error.code,
        status: error.status,
      });
    },
  });

  return {
    services,
    isLoading,
    isError,
    error: error ?? null,
    createService: createService.mutateAsync,
  };
}