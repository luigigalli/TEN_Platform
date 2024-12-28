import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Trip } from "@db/schema";

export function useTrips() {
  const queryClient = useQueryClient();

  const { data: trips, isLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const createTrip = useMutation({
    mutationFn: async (tripData: Partial<Trip>) => {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripData),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
    },
  });

  const inviteMember = useMutation({
    mutationFn: async ({ tripId, email }: { tripId: number; email: string }) => {
      const res = await fetch(`/api/trips/${tripId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "members"] });
    },
  });

  const updateCollaborationSettings = useMutation({
    mutationFn: async ({ 
      tripId, 
      settings 
    }: { 
      tripId: number; 
      settings: Trip['collaborationSettings'];
    }) => {
      const res = await fetch(`/api/trips/${tripId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaborationSettings: settings }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
    },
  });

  return {
    trips,
    isLoading,
    createTrip: createTrip.mutateAsync,
    inviteMember: inviteMember.mutateAsync,
    updateCollaborationSettings: updateCollaborationSettings.mutateAsync,
  };
}