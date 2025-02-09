import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast"; 
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Plus, AlertTriangle } from "lucide-react";
import { Permission, PermissionCategory } from "@/types/role";
import { SensitiveOperation, UserRole } from "@/types/user";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const permissionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.nativeEnum(PermissionCategory),
  action: z.string().min(1, "Action is required"),
  subject: z.string().min(1, "Subject is required"),
});

type PermissionFormData = z.infer<typeof permissionSchema>;

export default function PermissionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<PermissionCategory | "">("");
  const { user } = useCurrentUser();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  const form = useForm<PermissionFormData>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      name: "",
      description: "",
      category: PermissionCategory.USER_MANAGEMENT,
      action: "",
      subject: "",
    },
  });

  // Fetch permissions
  const { data: permissions = [], isLoading, isError } = useQuery({
    queryKey: ['permissions', searchTerm, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);

      const response = await fetch(`/api/auth/permissions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch permissions');
      return response.json() as Promise<Permission[]>;
    },
    retry: 1,
    refetchOnWindowFocus: false,
    initialData: [],
  });

  // Create permission mutation
  const createPermission = useMutation({
    mutationFn: async (data: PermissionFormData) => {
      // Check if user is super admin
      if (!isSuperAdmin) {
        throw new Error('Only super admins can create permissions');
      }

      const response = await fetch('/api/auth/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create permission');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Permission created successfully",
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

  // Delete permission mutation
  const deletePermission = useMutation({
    mutationFn: async (id: string) => {
      // Check if user is super admin
      if (!isSuperAdmin) {
        throw new Error('Only super admins can delete permissions');
      }

      const response = await fetch(`/api/auth/permissions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete permission');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast({
        title: "Success",
        description: "Permission deleted successfully",
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

  // Filter permissions based on search term and category
  const filteredPermissions = permissions.filter((permission: Permission) => {
    const matchesSearch = searchTerm
      ? permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.description?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    const matchesCategory = selectedCategory
      ? permission.category === selectedCategory
      : true;

    return matchesSearch && matchesCategory;
  });

  const onSubmit = (data: PermissionFormData) => {
    createPermission.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-red-500">Failed to load permissions. Please try again.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Permissions</h1>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Only super administrators can manage permissions. Please contact your system administrator if you need access.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Permissions</h1>
          <p className="text-muted-foreground">
            Manage system permissions
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Permission
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Permission</DialogTitle>
              <DialogDescription>
                Create a new permission that can be assigned to roles
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., view_users" />
                      </FormControl>
                      <FormDescription>
                        A unique identifier for this permission
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="e.g., Allows viewing the list of users" />
                      </FormControl>
                      <FormDescription>
                        A clear description of what this permission allows
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <select
                          className="w-full p-2 border rounded-md"
                          {...field}
                        >
                          {Object.values(PermissionCategory).map((category) => (
                            <option key={category} value={category}>
                              {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormDescription>
                        The category this permission belongs to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="action"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., view, create, update, delete" />
                      </FormControl>
                      <FormDescription>
                        The action this permission allows
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., users, posts, comments" />
                      </FormControl>
                      <FormDescription>
                        The resource this permission applies to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={createPermission.isPending}>
                    {createPermission.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Permission"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search permissions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as PermissionCategory)}
          className="border rounded-md px-3 py-2"
        >
          <option value="">All Categories</option>
          {Object.values(PermissionCategory).map((category) => (
            <option key={category} value={category}>
              {category.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Permissions</CardTitle>
          <CardDescription>
            List of all available permissions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Permission</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPermissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    {searchTerm || selectedCategory
                      ? "No permissions found matching your filters."
                      : "No permissions found."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPermissions.map((permission: Permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <span>{permission.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {permission.category.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {permission.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {permission.description}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this permission? This action cannot be undone.')) {
                            deletePermission.mutate(permission.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
