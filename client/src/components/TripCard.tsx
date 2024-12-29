import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, MapPinIcon } from "lucide-react";
import type { Trip, User } from "@db/schema";
import { format } from "date-fns";

interface TripCardProps {
  trip: Trip & {
    title: string;
    destination: string;
    description?: string | null;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
  };
  user: User & {
    username?: string | null;
    avatar?: string | null;
  };
}

/**
 * TripCard component displays a card with trip details and user information
 * @param props - Component props containing trip and user data
 * @returns React component
 */
export default function TripCard({ trip, user }: TripCardProps) {
  // Helper function to safely format dates
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "";
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Get user's initials or fallback
  const userInitial = user.username?.[0]?.toUpperCase() ?? "?";

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl line-clamp-2">
            {trip.title}
          </CardTitle>
          <Avatar>
            <AvatarImage 
              src={user.avatar ?? undefined} 
              alt={`${user.username ?? 'User'}'s avatar`}
            />
            <AvatarFallback aria-label={`${user.username ?? 'User'}'s initials`}>
              {userInitial}
            </AvatarFallback>
          </Avatar>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPinIcon className="h-4 w-4" aria-hidden="true" />
            <span>{trip.destination}</span>
          </div>
          {trip.startDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" aria-hidden="true" />
              <span>
                {formatDate(trip.startDate)}
                {trip.endDate && ` - ${formatDate(trip.endDate)}`}
              </span>
            </div>
          )}
          {trip.description && (
            <p className="text-sm mt-2 line-clamp-3">
              {trip.description}
            </p>
          )}
          {!trip.description && (
            <p className="text-sm mt-2 text-muted-foreground italic">
              No description available
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
