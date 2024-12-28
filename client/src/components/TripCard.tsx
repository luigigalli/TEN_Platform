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
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{trip.title}</CardTitle>
          <Avatar>
            <AvatarImage src={user.avatar} />
            <AvatarFallback>
              {user.username.charAt(0).toUpperCase()}
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
                {format(new Date(trip.startDate), "MMM d, yyyy")}
                {trip.endDate &&
                  ` - ${format(new Date(trip.endDate), "MMM d, yyyy")}`}
              </span>
            </div>
          )}
          <p className="text-sm mt-2">{trip.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
