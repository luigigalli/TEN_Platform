import { Card, CardContent } from "@/components/ui/card";
import ExpertCard from "../components/ExpertCard";
import TripCard from "../components/TripCard";
import { useTrips } from "../hooks/use-trips";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@db/schema";

interface Destination {
  title: string;
  image: string;
  location: string;
  alt?: string;
}

interface Expert {
  id: number;
  name: string;
  speciality: string;
  location: string;
  image: string | null;
  rating: number;
}

const FEATURED_DESTINATIONS: Destination[] = [
  {
    title: "Majestic Mountains",
    image: "https://images.unsplash.com/photo-1551279076-6887dee32c7e",
    location: "Swiss Alps",
    alt: "Snow-capped mountains in the Swiss Alps",
  },
  {
    title: "Tropical Paradise",
    image: "https://images.unsplash.com/photo-1683893884572-05ad954122b3",
    location: "Maldives",
    alt: "Crystal clear waters and overwater bungalows in the Maldives",
  },
  {
    title: "Historic Wonders",
    image: "https://images.unsplash.com/photo-1667561171094-f00484f0edb1",
    location: "Rome",
    alt: "Ancient Roman architecture and ruins",
  },
  {
    title: "Coastal Beauty",
    image: "https://images.unsplash.com/photo-1552873547-b88e7b2760e2",
    location: "Amalfi Coast",
    alt: "Colorful coastal town along the Amalfi Coast",
  },
];

const FEATURED_EXPERTS: Expert[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    speciality: "Mountain Expeditions",
    location: "Swiss Alps",
    image: "https://images.unsplash.com/photo-1535038828190-0dd8bb83258e",
    rating: 4.9,
  },
  {
    id: 2,
    name: "Marco Rivera",
    speciality: "Cultural Tours",
    location: "Rome",
    image: "https://images.unsplash.com/photo-1575891594916-2796520b6d83",
    rating: 4.8,
  },
];

export default function HomePage() {
  const { trips = [], isLoading: isLoadingTrips } = useTrips();
  const { data: users = [] } = useQuery<User[]>({ 
    queryKey: ["/api/users"],
    initialData: [],
  });

  const getRecentTrips = () => {
    if (isLoadingTrips || !trips.length) return [];
    
    return trips
      .slice(0, 6)
      .map((trip) => {
        const tripUser = users.find((u) => u.id === trip.userId);
        if (!tripUser) return null;
        return { trip, user: tripUser };
      })
      .filter((item): item is { trip: NonNullable<typeof trips[0]>; user: User } => item !== null);
  };

  const recentTrips = getRecentTrips();

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-3xl font-bold mb-6">Featured Destinations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_DESTINATIONS.map((destination) => (
            <Card key={destination.title} className="overflow-hidden group">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={destination.image}
                  alt={destination.alt ?? `${destination.title} in ${destination.location}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg">{destination.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {destination.location}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold mb-6">Local Experts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURED_EXPERTS.map((expert) => (
            <ExpertCard key={expert.id} expert={expert} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold mb-6">Recent Trips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentTrips.map(({ trip, user }) => (
            <TripCard key={trip.id} trip={trip} user={user} />
          ))}
        </div>
      </section>
    </div>
  );
}
