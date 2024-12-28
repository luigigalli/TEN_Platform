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
import type { Trip } from "@db/schema";
import TripCard from "../components/TripCard";
import TripCollaboration from "../components/TripCollaboration";

export default function TripPlanner() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const { trips, createTrip, isLoading } = useTrips();
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm<Partial<Trip>>({
    defaultValues: {
      title: "",
      description: "",
      destination: "",
      startDate: null,
      endDate: null,
      isPrivate: false,
      collaborationSettings: {
        canInvite: false,
        canEdit: false,
        canComment: true
      }
    },
  });

  const onSubmit = async (data: Partial<Trip>) => {
    try {
      await createTrip(data);
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Trip created successfully!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleTripClick = (trip: Trip) => {
    console.log('Trip clicked:', trip);
    setSelectedTrip(trip);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-48 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
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
                  {...form.register("title")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  {...form.register("destination")}
                />
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
                    {...form.register("startDate")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...form.register("endDate")}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Create Trip
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trips?.map((trip) => (
              <div
                key={trip.id}
                onClick={() => handleTripClick(trip)}
                className="cursor-pointer transition-transform hover:scale-105"
              >
                <TripCard trip={trip} user={user!} />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedTrip ? (
            <div className="bg-card rounded-lg p-6 shadow-lg sticky top-6">
              <h2 className="text-2xl font-semibold mb-6">Trip Collaboration</h2>
              <TripCollaboration trip={selectedTrip} />
            </div>
          ) : (
            <div className="bg-card rounded-lg p-6 shadow-lg text-center text-muted-foreground">
              Select a trip to view and manage collaboration settings
            </div>
          )}
        </div>
      </div>
    </div>
  );
}