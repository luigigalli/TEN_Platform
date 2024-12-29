import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, MapPinIcon } from "lucide-react";
import type { Trip, User } from "@db/schema";
import { format } from "date-fns";

interface TripCardProps {
  trip: Trip;
  user: User;
}

export default function TripCard({ trip, user }: TripCardProps) {
  // Helper function to safely format dates
  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return format(new Date(date), "MMM d, yyyy");
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{trip.title}</CardTitle>
          <Avatar>
            <AvatarImage src={user.avatar ?? undefined} />
            <AvatarFallback>
              {user.username?.[0]?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPinIcon className="h-4 w-4" />
            <span>{trip.destination}</span>
          </div>
          {trip.startDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {formatDate(trip.startDate)}
                {trip.endDate && ` - ${formatDate(trip.endDate)}`}
              </span>
            </div>
          )}
          <p className="text-sm mt-2">{trip.description ?? "No description available"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
