import { useState } from "react";
import { useTrips } from "../hooks/use-trips";
import { useUser } from "../hooks/use-user";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Trip } from "@db/schema";
import TripCard from "../components/TripCard";
import TripCollaboration from "../components/TripCollaboration";

const tripSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  destination: z.string().min(1, "Destination is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isPrivate: z.boolean().default(false),
  collaborationSettings: z.object({
    canInvite: z.boolean().default(false),
    canEdit: z.boolean().default(false),
    canComment: z.boolean().default(true),
  }),
});

type TripFormData = z.infer<typeof tripSchema>;

interface LoadingSkeletonProps {
  count?: number;
}

function LoadingSkeleton({ count = 4 }: LoadingSkeletonProps) {
  return (
    <div className="container mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-48 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="h-48 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface TripListProps {
  trips: Trip[];
  selectedTripId: number | null;
  onTripClick: (trip: Trip) => void;
  user: NonNullable<ReturnType<typeof useUser>["user"]>;
}

function TripList({ trips, selectedTripId, onTripClick, user }: TripListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {trips.map((trip) => (
        <div
          key={trip.id}
          onClick={() => onTripClick(trip)}
          className={`cursor-pointer transition-transform hover:scale-105 ${
            selectedTripId === trip.id ? 'ring-2 ring-primary' : ''
          }`}
          role="button"
          aria-selected={selectedTripId === trip.id}
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onTripClick(trip);
            }
          }}
        >
          <TripCard trip={trip} user={user} />
        </div>
      ))}
    </div>
  );
}

export default function TripPlanner() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const { trips = [], createTrip, isLoading } = useTrips();
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      title: "",
      description: "",
      destination: "",
      startDate: "",
      endDate: "",
      isPrivate: false,
      collaborationSettings: {
        canInvite: false,
        canEdit: false,
        canComment: true
      }
    },
  });

  const onSubmit = async (data: TripFormData) => {
    try {
      await createTrip(data);
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Trip created successfully!",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    }
  };

  const handleTripClick = (trip: Trip) => {
    setSelectedTrip(trip);
  };

  if (!user) {
    return (
      <div className="text-center py-8" role="alert">
        <p className="text-destructive">Please log in to view and create trips</p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trip Planner</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create New Trip</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Trip</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  aria-invalid={!!form.formState.errors.title}
                  {...form.register("title")}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  aria-invalid={!!form.formState.errors.destination}
                  {...form.register("destination")}
                />
                {form.formState.errors.destination && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.destination.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    aria-invalid={!!form.formState.errors.startDate}
                    {...form.register("startDate")}
                  />
                  {form.formState.errors.startDate && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.startDate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    aria-invalid={!!form.formState.errors.endDate}
                    {...form.register("endDate")}
                  />
                  {form.formState.errors.endDate && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.endDate.message}
                    </p>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Creating..." : "Create Trip"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TripList
            trips={trips}
            selectedTripId={selectedTrip?.id ?? null}
            onTripClick={handleTripClick}
            user={user}
          />
        </div>

        <div className="lg:col-span-1">
          {selectedTrip ? (
            <div className="bg-card rounded-lg shadow-lg sticky top-6">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-semibold">{selectedTrip.title}</h2>
                <p className="text-muted-foreground mt-1">
                  {selectedTrip.destination}
                </p>
              </div>
              <div className="p-6">
                <TripCollaboration trip={selectedTrip} />
              </div>
            </div>
          ) : (
            <div 
              className="bg-card rounded-lg p-6 shadow-lg text-center text-muted-foreground"
              role="region"
              aria-label="Trip details"
            >
              Select a trip to view and manage collaboration settings
            </div>
          )}
        </div>
      </div>
    </div>
  );
}