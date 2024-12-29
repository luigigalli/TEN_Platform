import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Service, InsertService } from "@db/schema";
import { z } from "zod";

// Validation schemas
const serviceSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  duration: z.number().int().positive(),
  // Add other fields as needed
});

const insertServiceSchema = serviceSchema.omit({ id: true });

const serviceResponseSchema = z.object({
  service: serviceSchema,
  message: z.string().min(1),
});

const errorResponseSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  status: z.number().optional(),
});

type ServiceData = z.infer<typeof serviceSchema>;
type ServiceResponse = z.infer<typeof serviceResponseSchema>;
type ErrorResponse = z.infer<typeof errorResponseSchema>;

class ServiceError extends Error {
  readonly code?: string;
  readonly status?: number;

  constructor(
    message: string,
    details?: {
      code?: string;
      status?: number;
    }
  ) {
    super(message);
    this.name = "ServiceError";
    
    if (details) {
      try {
        const validatedDetails = errorResponseSchema.parse(details);
        Object.assign(this, validatedDetails);
      } catch (error) {
        console.error('Invalid service error details:', error);
      }
    }

    // Make properties immutable
    Object.freeze(this);
  }

  /**
   * Creates a ServiceError from an API error response
   * @param response - The API error response
   * @returns A new ServiceError instance
   */
  static async fromResponse(response: Response): Promise<ServiceError> {
    try {
      const errorData = await response.json();
      const validatedError = errorResponseSchema.parse({
        message: errorData?.message || "API error occurred",
        code: errorData?.code || "api_error",
        status: response.status,
      });

      return new ServiceError(validatedError.message, {
        code: validatedError.code,
        status: validatedError.status,
      });
    } catch (error) {
      return new ServiceError("Failed to parse error response", {
        code: "parse_error",
        status: response.status,
      });
    }
  }

  /**
   * Creates a ServiceError from an unknown error
   * @param error - The unknown error object
   * @returns A new ServiceError instance
   */
  static fromUnknownError(error: unknown): ServiceError {
    if (error instanceof Error) {
      return new ServiceError(error.message, {
        code: "unknown_error",
        status: 500,
      });
    }
    return new ServiceError("An unknown error occurred", {
      code: "unknown_error",
      status: 500,
    });
  }
}

interface UseServicesResult {
  services: ServiceData[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: ServiceError | null;
  createService: (serviceData: InsertService) => Promise<ServiceResponse>;
}

/**
 * Validates service data before sending to API
 * @param serviceData - The service data to validate
 * @throws {ServiceError} If validation fails
 */
function validateServiceData(serviceData: InsertService): void {
  try {
    insertServiceSchema.parse(serviceData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ServiceError(`Invalid service data: ${error.message}`, {
        code: "validation_error",
        status: 400,
      });
    }
    throw ServiceError.fromUnknownError(error);
  }
}

/**
 * Hook for managing services
 * @returns Object containing services data and management functions
 * @throws {ServiceError} If there are any validation or API errors
 */
export function useServices(): UseServicesResult {
  const queryClient = useQueryClient();

  const { 
    data: services, 
    isLoading, 
    isError,
    error,
  } = useQuery<ServiceData[], ServiceError>({
    queryKey: ["/api/services"],
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => {
      try {
        return z.array(serviceSchema).parse(data);
      } catch (error) {
        console.error('Service data validation failed:', error);
        return [];
      }
    },
  });

  const createService = useMutation<ServiceResponse, ServiceError, InsertService>({
    mutationFn: async (serviceData: InsertService) => {
      try {
        // Validate input data
        validateServiceData(serviceData);

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
          throw await ServiceError.fromResponse(res);
        }

        const responseData = await res.json();
        
        // Validate response data
        return serviceResponseSchema.parse({
          service: responseData,
          message: "Service created successfully",
        });
      } catch (error) {
        if (error instanceof ServiceError) {
          throw error;
        }
        throw ServiceError.fromUnknownError(error);
      }
    },
    onSuccess: (data) => {
      // Update cache with validated data
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      queryClient.setQueryData<ServiceData[]>(["/api/services"], (old) => {
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