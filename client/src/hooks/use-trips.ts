import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Trip } from "@db/schema";
import { useToast } from "@/hooks/use-toast";

interface TripError extends Error {
  code?: string;
  status?: number;
}

interface CreateTripData extends Partial<Trip> {
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
}

interface InviteMemberData {
  tripId: number;
  email: string;
}

interface UpdateCollaborationData {
  tripId: number;
  settings: Trip['collaborationSettings'];
}

interface UseTripsResult {
  trips: Trip[];
  isLoading: boolean;
  isError: boolean;
  error: TripError | null;
  createTrip: (data: CreateTripData) => Promise<Trip>;
  inviteMember: (data: InviteMemberData) => Promise<void>;
  updateCollaborationSettings: (data: UpdateCollaborationData) => Promise<Trip>;
}

/**
 * Hook for managing trips
 * @returns Object containing trips data and management functions
 */
export function useTrips(): UseTripsResult {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { 
    data: trips, 
    isLoading,
    isError,
    error,
  } = useQuery<Trip[], TripError>({
    queryKey: ["/api/trips"],
    onError: (error: TripError) => {
      toast({
        variant: "destructive",
        title: "Error fetching trips",
        description: error.message,
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  const createTrip = useMutation<Trip, TripError, CreateTripData>({
    mutationFn: async (tripData: CreateTripData) => {
      try {
        const res = await fetch("/api/trips", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(tripData),
          credentials: "include",
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          const error = new Error(
            errorData?.message || "Failed to create trip"
          ) as TripError;
          error.status = res.status;
          error.code = errorData?.code || "create_trip_failed";
          throw error;
        }

        return res.json();
      } catch (err) {
        if (err instanceof Error) {
          const tripError = err as TripError;
          tripError.code = tripError.code || "unknown_error";
          throw tripError;
        }
        throw new Error("An unknown error occurred");
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.setQueryData<Trip[]>(["/api/trips"], (old) => {
        if (!old) return [data];
        return [...old, data];
      });
      toast({
        title: "Success",
        description: "Trip created successfully!",
      });
    },
    onError: (error: TripError) => {
      toast({
        variant: "destructive",
        title: "Error creating trip",
        description: error.message,
      });
    },
  });

  const inviteMember = useMutation<void, TripError, InviteMemberData>({
    mutationFn: async ({ tripId, email }) => {
      try {
        const res = await fetch(`/api/trips/${tripId}/members`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ email }),
          credentials: "include",
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          const error = new Error(
            errorData?.message || "Failed to invite member"
          ) as TripError;
          error.status = res.status;
          error.code = errorData?.code || "invite_member_failed";
          throw error;
        }

        return res.json();
      } catch (err) {
        if (err instanceof Error) {
          const tripError = err as TripError;
          tripError.code = tripError.code || "unknown_error";
          throw tripError;
        }
        throw new Error("An unknown error occurred");
      }
    },
    onSuccess: (_, { tripId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "members"] });
      toast({
        title: "Success",
        description: "Member invited successfully!",
      });
    },
    onError: (error: TripError) => {
      toast({
        variant: "destructive",
        title: "Error inviting member",
        description: error.message,
      });
    },
  });

  const updateCollaborationSettings = useMutation<Trip, TripError, UpdateCollaborationData>({
    mutationFn: async ({ tripId, settings }) => {
      try {
        const res = await fetch(`/api/trips/${tripId}/settings`, {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ collaborationSettings: settings }),
          credentials: "include",
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          const error = new Error(
            errorData?.message || "Failed to update collaboration settings"
          ) as TripError;
          error.status = res.status;
          error.code = errorData?.code || "update_settings_failed";
          throw error;
        }

        return res.json();
      } catch (err) {
        if (err instanceof Error) {
          const tripError = err as TripError;
          tripError.code = tripError.code || "unknown_error";
          throw tripError;
        }
        throw new Error("An unknown error occurred");
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.setQueryData<Trip[]>(["/api/trips"], (old) => {
        if (!old) return [data];
        return old.map((trip) => 
          trip.id === data.id ? data : trip
        );
      });
      toast({
        title: "Success",
        description: "Collaboration settings updated successfully!",
      });
    },
    onError: (error: TripError) => {
      toast({
        variant: "destructive",
        title: "Error updating collaboration settings",
        description: error.message,
      });
    },
  });

  return {
    trips: trips || [],
    isLoading,
    isError,
    error: error ?? null,
    createTrip: createTrip.mutateAsync,
    inviteMember: inviteMember.mutateAsync,
    updateCollaborationSettings: updateCollaborationSettings.mutateAsync,
  };
}