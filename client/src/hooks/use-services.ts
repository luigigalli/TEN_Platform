import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Service, InsertService } from "@db/schema";

export function useServices() {
  const queryClient = useQueryClient();

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const createService = useMutation({
    mutationFn: async (serviceData: InsertService) => {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceData),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    },
  });

  return {
    services,
    isLoading,
    createService: createService.mutateAsync,
  };
}
