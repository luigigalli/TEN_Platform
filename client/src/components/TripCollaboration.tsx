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
  trip: Trip & {
    collaborationSettings?: CollaborationSettings | null;
  };
}

interface InviteMemberResponse {
  success: boolean;
  message: string;
}

interface UpdateSettingsResponse {
  success: boolean;
  message: string;
  settings: CollaborationSettings;
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
  const { data: members = [], isError: membersError } = useQuery<TripMember[], Error>({
    queryKey: ["/api/trips", trip.id, "members"],
    enabled: Boolean(trip.id),
  });

  // Fetch trip activities
  const { data: activities = [], isError: activitiesError } = useQuery<TripActivity[], Error>({
    queryKey: ["/api/trips", trip.id, "activities"],
    enabled: Boolean(trip.id),
  });

  // Fetch all users for member lookup
  const { data: users = [], isError: usersError } = useQuery<User[], Error>({
    queryKey: ["/api/users"],
  });

  // Handle any query errors
  if (membersError || activitiesError || usersError) {
    toast({
      title: "Error",
      description: "Failed to load collaboration data",
      variant: "destructive",
    });
  }

  // Helper function to safely get member details
  const getMemberDetails = (userId: number | null): User | undefined => {
    if (userId === null) return undefined;
    return users.find((u) => u.id === userId);
  };

  // Helper function to safely format dates
  const formatDate = (date: Date | string | null): string => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  // Mutations with proper error handling
  const inviteMember = useMutation<InviteMemberResponse, Error, void>({
    mutationFn: async () => {
      const response = await fetch(`/api/trips/${trip.id}/invite`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to invite member");
      }
      
      return data;
    },
    onSuccess: (data) => {
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/trips", trip.id, "members"] });
      toast({
        title: "Success",
        description: data.message || `Invitation sent to ${inviteEmail}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  // Update collaboration settings with proper type checking
  const updateSettings = useMutation<
    UpdateSettingsResponse,
    Error,
    Partial<CollaborationSettings>
  >({
    mutationFn: async (newSettings) => {
      const currentSettings = trip.collaborationSettings ?? DEFAULT_SETTINGS;
      const updatedSettings: CollaborationSettings = {
        ...currentSettings,
        ...newSettings,
      };

      const response = await fetch(`/api/trips/${trip.id}/settings`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updatedSettings),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to update settings");
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", trip.id] });
      toast({
        title: "Success",
        description: data.message || "Collaboration settings have been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleInvite = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
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
                required
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={inviteMember.isPending}
              />
            </div>
            <Button 
              type="submit" 
              disabled={inviteMember.isPending || !inviteEmail.trim()}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {inviteMember.isPending ? "Inviting..." : "Invite"}
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
                      <AvatarImage 
                        src={memberDetails?.avatar ?? undefined} 
                        alt={memberDetails?.username ?? 'User avatar'}
                      />
                      <AvatarFallback>
                        {memberDetails?.username?.[0]?.toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {memberDetails?.username ?? 'Unknown User'}
                      </p>
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
              <Label htmlFor="allow-invites">Allow Invites</Label>
              <p className="text-sm text-muted-foreground">
                Members can invite others to join
              </p>
            </div>
            <Switch
              id="allow-invites"
              checked={currentSettings.canInvite}
              onCheckedChange={(checked) =>
                updateSettings.mutate({ canInvite: checked })
              }
              disabled={updateSettings.isPending}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allow-editing">Allow Editing</Label>
              <p className="text-sm text-muted-foreground">
                Members can edit trip details
              </p>
            </div>
            <Switch
              id="allow-editing"
              checked={currentSettings.canEdit}
              onCheckedChange={(checked) =>
                updateSettings.mutate({ canEdit: checked })
              }
              disabled={updateSettings.isPending}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allow-comments">Allow Comments</Label>
              <p className="text-sm text-muted-foreground">
                Members can leave comments
              </p>
            </div>
            <Switch
              id="allow-comments"
              checked={currentSettings.canComment}
              onCheckedChange={(checked) =>
                updateSettings.mutate({ canComment: checked })
              }
              disabled={updateSettings.isPending}
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
                      <AvatarImage 
                        src={activityUser?.avatar ?? undefined}
                        alt={activityUser?.username ?? 'User avatar'}
                      />
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