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

export default function Profile({ userId }: ProfileProps) {
  const { user: currentUser } = useUser();
  const { trips } = useTrips();
  const { data: posts } = useQuery<Post[]>({ queryKey: ["/api/posts"] });
  const { data: users } = useQuery<User[]>({ queryKey: ["/api/users"] });

  const user = userId
    ? users?.find((u) => u.id === userId)
    : currentUser;

  if (!user) return null;

  const userTrips = trips?.filter((trip) => trip.userId === user.id);
  const userPosts = posts?.filter((post) => post.userId === user.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{user.fullName || user.username}</h1>
              {user.bio && <p className="text-muted-foreground mt-2">{user.bio}</p>}
              <div className="flex gap-4 mt-4">
                <div>
                  <span className="font-semibold">{userTrips?.length || 0}</span>
                  <span className="text-muted-foreground ml-2">Trips</span>
                </div>
                <div>
                  <span className="font-semibold">{userPosts?.length || 0}</span>
                  <span className="text-muted-foreground ml-2">Posts</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="trips">
        <TabsList>
          <TabsTrigger value="trips">Trips</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
        </TabsList>
        <TabsContent value="trips" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userTrips?.map((trip) => (
              <TripCard key={trip.id} trip={trip} user={user} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="posts" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userPosts?.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {post.content}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
