import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { UserForm } from "@/components/users/UserForm";
import { userApi, type User } from "@/api/users";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user" | "expert";
  status: "active" | "inactive" | "pending";
}

export default function EditUserPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // TODO: Implement API call to fetch user
        // Mock API call
        setUser({
          id: params.id,
          email: "john.doe@example.com",
          firstName: "John",
          lastName: "Doe",
          role: "user",
          status: "active",
        });
      } catch (error) {
        console.error("Error fetching user:", error);
        toast({
          title: "Error",
          description: "Failed to load user data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [params.id, toast]);

  const handleSubmit = async (data: any) => {
    try {
      // TODO: Implement API call to update user
      console.log("Updating user:", data);
      
      toast({
        title: "User updated",
        description: "The user has been updated successfully.",
      });
      
      setLocation("/admin/users");
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "There was an error updating the user. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
          <div className="space-y-4">
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">User not found</h2>
          <p className="text-muted-foreground">
            The user you're looking for doesn't exist or has been deleted.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit User</h1>
          <p className="text-muted-foreground">
            Update user information and permissions
          </p>
        </div>

        <UserForm
          initialData={user}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </AdminLayout>
  );
}
