import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../providers/AuthProvider';
import { usePermissions } from '../../hooks/use-permissions';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user: currentUser } = useAuth();
  const { canViewUserFinancials, canEditUserFinancials } = usePermissions();
  const params = useParams<{ id: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  const isOwnProfile = currentUser?.id === params.id;
  const canEdit = isOwnProfile || currentUser?.role === 'admin';
  const showFinancial = canViewUserFinancials();
  const canEditFinancial = canEditUserFinancials();

  console.log('Profile page permissions:', {
    currentUser,
    isOwnProfile,
    canEdit,
    showFinancial,
    canEditFinancial
  });

  // Fetch user data
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['users', params.id],
    queryFn: async () => {
      if (!params.id) throw new Error('User ID is required');
      console.log('Fetching user data for ID:', params.id);
      try {
        const userData = await api.users.get(params.id);
        console.log('Fetched user data:', userData);
        return userData;
      } catch (err) {
        console.error('Error fetching user:', err);
        throw err;
      }
    },
  });

  useEffect(() => {
    console.log('Current params.id:', params.id);
    console.log('Current user data:', user);
  }, [params.id, user]);

  useEffect(() => {
    if (error) {
      console.error('Profile page error:', error);
    }
  }, [error]);

  if (isLoading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Loading profile...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Error loading profile</CardTitle>
          <CardDescription>{(error as Error).message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>User not found</CardTitle>
          <CardDescription>The requested user profile could not be found.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.users.update>[1]) =>
      api.users.update(params.id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', params.id] });
      toast({
        title: 'Profile updated',
        status: 'success',
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: 'Error updating profile',
        description: error.message,
        status: 'error',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    updateMutation.mutate(data);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.image_name} alt={user?.name} />
              <AvatarFallback>{`${user?.fname?.[0]}${user?.lname?.[0]}`}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user?.name || `${user?.fname} ${user?.lname}`}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </div>
          </div>
          {canEdit && (
            <Button
              variant={isEditing ? "outline" : "default"}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Separator />

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className={`grid w-full ${showFinancial ? 'grid-cols-5' : 'grid-cols-4'}`}>
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="contact">Contact Details</TabsTrigger>
                <TabsTrigger value="account">Account Settings</TabsTrigger>
                {showFinancial && <TabsTrigger value="financial">Financial Information</TabsTrigger>}
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prefix</Label>
                      <Select
                        name="prefix"
                        defaultValue={user?.prefix}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select prefix" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mr">Mr</SelectItem>
                          <SelectItem value="Mrs">Mrs</SelectItem>
                          <SelectItem value="Ms">Ms</SelectItem>
                          <SelectItem value="Dr">Dr</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        name="fname"
                        defaultValue={user?.fname}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Middle Name</Label>
                      <Input
                        name="mname"
                        defaultValue={user?.mname}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        name="lname"
                        defaultValue={user?.lname}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Suffix</Label>
                      <Input
                        name="suffix"
                        defaultValue={user?.suffix}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Birthday</Label>
                      <Input
                        type="date"
                        name="bday"
                        defaultValue={user?.bday}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender</Label>
                      <Select
                        name="gender"
                        defaultValue={user?.gender}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                          <SelectItem value="O">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Short Bio</Label>
                    <Input
                      name="short_bio"
                      defaultValue={user?.short_bio}
                      readOnly={!isEditing}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      name="email"
                      defaultValue={user?.email}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Country Code</Label>
                      <Input
                        name="phonecode"
                        defaultValue={user?.phonecode}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        name="phone"
                        defaultValue={user?.phone}
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="account" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      name="username"
                      defaultValue={user?.username}
                      readOnly={!isEditing}
                    />
                  </div>
                  {isEditing && (
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input
                        type="password"
                        name="password"
                        placeholder="Leave blank to keep current password"
                      />
                    </div>
                  )}
                </TabsContent>

                {showFinancial && (
                  <TabsContent value="financial" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>IBAN</Label>
                        <Input
                          name="iban"
                          defaultValue={user?.iban}
                          readOnly={!isEditing || !canEditFinancial}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>SWIFT Code</Label>
                        <Input
                          name="swift_code"
                          defaultValue={user?.swift_code}
                          readOnly={!isEditing || !canEditFinancial}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Account Number</Label>
                        <Input
                          name="acc_no"
                          defaultValue={user?.acc_no}
                          readOnly={!isEditing || !canEditFinancial}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bank Name</Label>
                        <Input
                          name="bank_name"
                          defaultValue={user?.bank_name}
                          readOnly={!isEditing || !canEditFinancial}
                        />
                      </div>
                    </div>
                  </TabsContent>
                )}

                <TabsContent value="preferences" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Primary Language</Label>
                    <Select
                      name="language"
                      defaultValue={user?.language}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Other Languages</Label>
                    <Input
                      name="others_lang_name"
                      defaultValue={user?.others_lang_name}
                      readOnly={!isEditing}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            {isEditing && (
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
