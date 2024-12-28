import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Trip } from "@db/schema";
import { useToast } from "@/hooks/use-toast";

export function useTrips() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: trips, isLoading, error } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error fetching trips",
        description: error.message
      });
    }
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
      toast({
        title: "Success",
        description: "Trip created successfully!"
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error creating trip",
        description: error.message
      });
    }
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
      toast({
        title: "Success",
        description: "Member invited successfully!"
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error inviting member",
        description: error.message
      });
    }
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
      toast({
        title: "Success",
        description: "Collaboration settings updated successfully!"
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error updating collaboration settings",
        description: error.message
      });
    }
  });

  return {
    trips: trips || [],
    isLoading,
    error,
    createTrip: createTrip.mutateAsync,
    inviteMember: inviteMember.mutateAsync,
    updateCollaborationSettings: updateCollaborationSettings.mutateAsync,
  };
}