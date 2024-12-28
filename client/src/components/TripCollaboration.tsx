import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "../hooks/use-user";
import type { Trip, TripMember, TripActivity, User, CollaborationSettings } from "@db/schema";
import { 
  UserPlus, 
  Settings2, 
  Users,
  Activity,
  Clock,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface TripCollaborationProps {
  trip: Trip;
}

export default function TripCollaboration({ trip }: TripCollaborationProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();

  // Fetch trip members
  const { data: members = [] } = useQuery<TripMember[]>({
    queryKey: ["/api/trips", trip.id, "members"],
    enabled: !!trip.id,
  });

  // Fetch trip activities
  const { data: activities = [] } = useQuery<TripActivity[]>({
    queryKey: ["/api/trips", trip.id, "activities"],
    enabled: !!trip.id,
  });

  // Fetch all users for member lookup
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Mutations for trip collaboration
  const inviteMember = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch(`/api/trips/${trip.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/trips", trip.id, "members"] 
      });
      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });
      setInviteEmail("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const updateCollaborationSettings = useMutation({
    mutationFn: async (settings: CollaborationSettings) => {
      const res = await fetch(`/api/trips/${trip.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaborationSettings: settings }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      toast({
        title: "Success",
        description: "Collaboration settings updated",
      });
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMember.mutate(inviteEmail);
  };

  const getMemberDetails = (memberId: number) => {
    return users.find(u => u.id === memberId);
  };

  const isOwner = trip.userId === user?.id;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="members">
        <TabsList className="w-full">
          <TabsTrigger value="members" className="flex-1">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1">
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="settings" className="flex-1">
              <Settings2 className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {isOwner && (
            <form onSubmit={handleInvite} className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter email to invite"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={inviteMember.isPending}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </form>
          )}

          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {members.map((member) => {
                const memberDetails = getMemberDetails(member.userId);
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={memberDetails?.avatar || undefined} />
                        <AvatarFallback>
                          {memberDetails?.username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{memberDetails?.username || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {member.role}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {activities.map((activity) => {
                const activityUser = getMemberDetails(activity.createdBy);
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-2 rounded-lg border"
                  >
                    <Avatar className="mt-1">
                      <AvatarImage src={activityUser?.avatar || undefined} />
                      <AvatarFallback>
                        {activityUser?.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{activityUser?.username || 'Unknown User'}</p>
                        <span className="text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(activity.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{activity.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {isOwner && (
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Members to Invite</Label>
                  <p className="text-sm text-muted-foreground">
                    Members can invite other people to join the trip
                  </p>
                </div>
                <Switch
                  checked={trip.collaborationSettings.canInvite}
                  onCheckedChange={(checked) =>
                    updateCollaborationSettings.mutate({
                      ...trip.collaborationSettings,
                      canInvite: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Members to Edit</Label>
                  <p className="text-sm text-muted-foreground">
                    Members can edit trip details and itinerary
                  </p>
                </div>
                <Switch
                  checked={trip.collaborationSettings.canEdit}
                  onCheckedChange={(checked) =>
                    updateCollaborationSettings.mutate({
                      ...trip.collaborationSettings,
                      canEdit: checked,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Comments</Label>
                  <p className="text-sm text-muted-foreground">
                    Members can leave comments and suggestions
                  </p>
                </div>
                <Switch
                  checked={trip.collaborationSettings.canComment}
                  onCheckedChange={(checked) =>
                    updateCollaborationSettings.mutate({
                      ...trip.collaborationSettings,
                      canComment: checked,
                    })
                  }
                />
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}