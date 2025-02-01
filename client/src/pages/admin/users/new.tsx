import AdminLayout from "@/components/AdminLayout";
import { UserForm } from "@/components/users/UserForm";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function CreateUserPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (data: any) => {
    try {
      // TODO: Implement API call to create user
      console.log("Creating user:", data);
      
      toast({
        title: "User created",
        description: "The user has been created successfully.",
      });
      
      setLocation("/admin/users");
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: "There was an error creating the user. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create User</h1>
          <p className="text-muted-foreground">
            Add a new user to the system
          </p>
        </div>

        <UserForm onSubmit={handleSubmit} />
      </div>
    </AdminLayout>
  );
}
