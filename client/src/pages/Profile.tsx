import { useUser } from "../hooks/use-user";
import { useTrips } from "../hooks/use-trips";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TripCard from "../components/TripCard";
import type { Post, User } from "@db/schema";

interface ProfileProps {
  userId?: number;
}

interface ProfileStats {
  trips: number;
  posts: number;
}

interface PostCardProps {
  post: Post;
}

function PostCard({ post }: PostCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {post.content}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

function ProfileStats({ trips, posts }: ProfileStats) {
  return (
    <div className="flex gap-4 mt-4">
      <div>
        <span className="font-semibold">{trips}</span>
        <span className="text-muted-foreground ml-2">Trips</span>
      </div>
      <div>
        <span className="font-semibold">{posts}</span>
        <span className="text-muted-foreground ml-2">Posts</span>
      </div>
    </div>
  );
}

export default function Profile({ userId }: ProfileProps) {
  const { user: currentUser } = useUser();
  const { trips = [] } = useTrips();
  const { data: posts = [] } = useQuery<Post[]>({ 
    queryKey: ["/api/posts"],
    initialData: [],
  });
  const { data: users = [] } = useQuery<User[]>({ 
    queryKey: ["/api/users"],
    initialData: [],
  });

  const user = userId
    ? users.find((u) => u.id === userId)
    : currentUser;

  if (!user) {
    return (
      <div className="text-center py-8" role="alert">
        <p className="text-destructive">User not found</p>
      </div>
    );
  }

  const userTrips = trips.filter((trip) => trip.userId === user.id);
  const userPosts = posts.filter((post) => post.userId === user.id);

  // Get user initials for avatar fallback
  const getUserInitials = (name: string | undefined | null) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage 
                src={user.avatar ?? undefined} 
                alt={`${user.username}'s profile picture`}
              />
              <AvatarFallback>
                {getUserInitials(user.fullName || user.username)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {user.fullName || user.username}
              </h1>
              {user.bio && (
                <p className="text-muted-foreground mt-2">
                  {user.bio}
                </p>
              )}
              <ProfileStats 
                trips={userTrips.length} 
                posts={userPosts.length}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="trips">
        <TabsList>
          <TabsTrigger value="trips">
            Trips ({userTrips.length})
          </TabsTrigger>
          <TabsTrigger value="posts">
            Posts ({userPosts.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="trips" className="mt-6">
          {userTrips.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No trips yet
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userTrips.map((trip) => (
                <TripCard 
                  key={trip.id} 
                  trip={trip} 
                  user={user} 
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="posts" className="mt-6">
          {userPosts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No posts yet
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
