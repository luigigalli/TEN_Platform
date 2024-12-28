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

export default function TripPlanner() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { trips, createTrip } = useTrips();
  const { user } = useUser();
  const { toast } = useToast();
  
  const form = useForm<Partial<Trip>>({
    defaultValues: {
      title: "",
      description: "",
      destination: "",
      startDate: undefined,
      endDate: undefined,
      isPrivate: false,
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

  return (
    <div className="space-y-6">
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
                  {...form.register("title", { required: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  {...form.register("destination", { required: true })}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips?.map((trip) => (
          <TripCard key={trip.id} trip={trip} user={user!} />
        ))}
      </div>
    </div>
  );
}
