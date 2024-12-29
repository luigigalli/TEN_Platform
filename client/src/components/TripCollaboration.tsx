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

// Default collaboration settings
const DEFAULT_SETTINGS: CollaborationSettings = {
  canInvite: false,
  canEdit: false,
  canComment: true,
};

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

  // Helper function to safely get member details
  const getMemberDetails = (userId: number | null): User | undefined => {
    if (!userId) return undefined;
    return users.find((u) => u.id === userId);
  };

  // Helper function to safely format dates
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  // Mutations with proper error handling
  const inviteMember = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/trips/${trip.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      if (!response.ok) throw new Error("Failed to invite member");
      return response.json();
    },
    onSuccess: () => {
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/trips", trip.id, "members"] });
      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${inviteEmail}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update collaboration settings with proper type checking
  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<CollaborationSettings>) => {
      const currentSettings = trip.collaborationSettings ?? DEFAULT_SETTINGS;
      const updatedSettings: CollaborationSettings = {
        ...currentSettings,
        ...newSettings,
      };

      const response = await fetch(`/api/trips/${trip.id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings),
      });
      if (!response.ok) throw new Error("Failed to update settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", trip.id] });
      toast({
        title: "Settings updated",
        description: "Collaboration settings have been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }
    inviteMember.mutate();
  };

  const currentSettings = trip.collaborationSettings ?? DEFAULT_SETTINGS;

  return (
    <Tabs defaultValue="members" className="w-full">
      <TabsList>
        <TabsTrigger value="members">
          <Users className="h-4 w-4 mr-2" />
          Members
        </TabsTrigger>
        <TabsTrigger value="settings">
          <Settings2 className="h-4 w-4 mr-2" />
          Settings
        </TabsTrigger>
        <TabsTrigger value="activity">
          <Activity className="h-4 w-4 mr-2" />
          Activity
        </TabsTrigger>
      </TabsList>

      <TabsContent value="members" className="space-y-4">
        {currentSettings.canInvite && (
          <form onSubmit={handleInvite} className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="email">Invite by email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
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
                      <AvatarImage src={memberDetails?.avatar ?? undefined} />
                      <AvatarFallback>
                        {memberDetails?.username?.[0]?.toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{memberDetails?.username ?? 'Unknown User'}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {member.role}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(member.joinedAt)}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="settings" className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Invites</Label>
              <p className="text-sm text-muted-foreground">
                Members can invite others to join
              </p>
            </div>
            <Switch
              checked={currentSettings.canInvite}
              onCheckedChange={(checked) =>
                updateSettings.mutate({ canInvite: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Editing</Label>
              <p className="text-sm text-muted-foreground">
                Members can edit trip details
              </p>
            </div>
            <Switch
              checked={currentSettings.canEdit}
              onCheckedChange={(checked) =>
                updateSettings.mutate({ canEdit: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Comments</Label>
              <p className="text-sm text-muted-foreground">
                Members can leave comments
              </p>
            </div>
            <Switch
              checked={currentSettings.canComment}
              onCheckedChange={(checked) =>
                updateSettings.mutate({ canComment: checked })
              }
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="activity" className="space-y-4">
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {activities.map((activity) => {
              const activityUser = getMemberDetails(activity.createdBy);
              return (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-2 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={activityUser?.avatar ?? undefined} />
                      <AvatarFallback>
                        {activityUser?.username?.[0]?.toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {activityUser?.username ?? 'Unknown User'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.action}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDate(activity.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}