import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "../hooks/use-user";
import type { SelectBooking } from "@db/schema";
import { format } from "date-fns";

interface BookingError extends Error {
  message: string;
}

interface BookingCardProps {
  booking: SelectBooking;
}

function BookingCard({ booking }: BookingCardProps) {
  const startDate = new Date(booking.startDate);
  const endDate = booking.endDate ? new Date(booking.endDate) : null;
  const formattedPrice = (Number(booking.totalPrice) || 0).toFixed(2);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Booking #{booking.id}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">{format(startDate, 'PPP')}</p>
            </div>
            {endDate && (
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">{format(endDate, 'PPP')}</p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="font-medium">${formattedPrice}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{booking.status}</p>
            </div>
          </div>

          {booking.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm">{booking.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function BookingsPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const {
    data: bookings = [],
    isLoading,
    error,
  } = useQuery<SelectBooking[], BookingError>({
    queryKey: ["bookings", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/bookings", {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch bookings");
      }

      return response.json();
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" role="status">
        <Loader2 className="h-8 w-8 animate-spin" aria-label="Loading bookings" />
      </div>
    );
  }

  if (error) {
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message || "Failed to load bookings",
    });
    return (
      <div className="text-center py-8" role="alert">
        <p className="text-destructive">
          Error loading bookings: {error.message || "An unexpected error occurred"}
        </p>
      </div>
    );
  }

  if (!bookings.length) {
    return (
      <div className="text-center py-8" role="status">
        <p className="text-muted-foreground">You don't have any bookings yet.</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Your Bookings</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    </div>
  );
}
