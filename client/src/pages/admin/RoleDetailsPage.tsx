import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ArrowLeft, Copy, Trash2, AlertTriangle } from "lucide-react";
import { Permission, PermissionCategory, Role, RoleInput, RoleType } from "@/types/role";
import { SensitiveOperation, UserRole } from "@/types/user";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast"; // Fix useToast import

const roleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.nativeEnum(RoleType),
  permissions: z.array(z.object({
    permissionId: z.string(),
    granted: z.boolean(),
    conditions: z.record(z.any()).optional(),
  })),
});

type RoleFormData = z.infer<typeof roleSchema>;

export default function RoleDetailsPage() {
  const { id: roleId } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isNewRole = roleId === "new";
  const isCloning = new URLSearchParams(window.location.search).get('clone') === 'true';

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      type: RoleType.EXTERNAL,
      permissions: [],
    },
  });

  // Fetch role details if editing
  const { data: role, isLoading: roleLoading } = useQuery({
    queryKey: ['roles', roleId],
    queryFn: async () => {
      if (isNewRole) return null;
      const response = await fetch(`/api/roles/${roleId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Role not found');
        }
        throw new Error('Failed to fetch role');
      }
      return response.json();
    },
    enabled: !!roleId,
  });

  // Fetch all permissions
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await fetch('/api/permissions');
      if (!response.ok) throw new Error('Failed to fetch permissions');
      return response.json();
    },
  });

  // Set form values when role data is loaded
  useEffect(() => {
    if (role) {
      form.reset({
        name: role.name,
        description: role.description,
        type: role.type,
        permissions: role.permissions.map(p => ({
          permissionId: p.permissionId,
          granted: p.granted,
          conditions: p.conditions,
        })),
      });
    }
  }, [role, form]);

  // Create/Update role mutation
  const saveRole = useMutation({
    mutationFn: async (data: RoleFormData) => {
      const response = await fetch(roleId ? `/api/roles/${roleId}` : '/api/roles', {
        method: roleId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save role');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      navigate('/admin/roles');
      toast({
        title: 'Success',
        description: `Role ${roleId ? 'updated' : 'created'} successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete role mutation
  const deleteRole = useMutation({
    mutationFn: async () => {
      if (!isSuperAdmin) {
        throw new Error('Only super admins can delete roles');
      }

      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete role');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      navigate('/admin/roles');
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Clone role function
  const cloneRole = () => {
    if (role) {
      navigate(`/admin/roles/new?clone=true&from=${roleId}`);
    }
  };

  // Check if user can modify this role
  const canModifyRole = isSuperAdmin || (!role?.isSystem && user?.role === UserRole.ADMIN);

  if (!canModifyRole && !isNewRole) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/roles")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Role Details</h1>
        </div>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to modify this role. System roles can only be modified by super administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const onSubmit = (data: RoleFormData) => {
    saveRole.mutate(data);
  };

  if (roleLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, permission) => {
    const category = permission.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<PermissionCategory, Permission[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/roles")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isNewRole ? "Create Role" : isCloning ? "Clone Role" : `Edit Role: ${role?.name}`}
            </h1>
            <p className="text-muted-foreground">
              {isNewRole
                ? "Create a new role and assign permissions"
                : isCloning
                ? "Create a new role based on an existing one"
                : "Modify role details and permissions"}
            </p>
          </div>
        </div>
        {!isNewRole && !isCloning && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={cloneRole}
            >
              <Copy className="h-4 w-4 mr-2" />
              Clone
            </Button>
            {isSuperAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the role
                      and remove it from all users who currently have it assigned.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteRole.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteRole.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete Role"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Role Details</CardTitle>
              <CardDescription>
                Basic information about the role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      A unique name for this role
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
                      <Textarea {...field} />
                    </FormControl>
                    <FormDescription>
                      A brief description of this role's purpose
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <select
                        className="w-full p-2 border rounded-md"
                        {...field}
                      >
                        <option value={RoleType.ADMINISTRATIVE}>Administrative</option>
                        <option value={RoleType.EXTERNAL}>External</option>
                      </select>
                    </FormControl>
                    <FormDescription>
                      Whether this is an administrative or external user role
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Configure what users with this role can do
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={Object.keys(permissionsByCategory)[0]} className="space-y-4">
                <TabsList>
                  {Object.entries(permissionsByCategory).map(([category]) => (
                    <TabsTrigger key={category} value={category}>
                      {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                  <TabsContent key={category} value={category} className="space-y-4">
                    {categoryPermissions.map((permission) => (
                      <FormField
                        key={permission.id}
                        control={form.control}
                        name={`permissions`}
                        render={({ field }) => {
                          const currentPermission = field.value?.find(
                            p => p.permissionId === permission.id
                          );
                          return (
                            <FormItem
                              key={permission.id}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={currentPermission?.granted}
                                  onCheckedChange={(checked) => {
                                    const newPermissions = field.value || [];
                                    const index = newPermissions.findIndex(
                                      p => p.permissionId === permission.id
                                    );
                                    if (index > -1) {
                                      newPermissions[index] = {
                                        ...newPermissions[index],
                                        granted: checked,
                                      };
                                    } else {
                                      newPermissions.push({
                                        permissionId: permission.id,
                                        granted: checked,
                                        conditions: {},
                                      });
                                    }
                                    field.onChange(newPermissions);
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-medium leading-none">
                                  {permission.name}
                                </FormLabel>
                                <p className="text-sm text-muted-foreground">
                                  {permission.description}
                                </p>
                              </div>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/roles")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveRole.isPending}>
              {saveRole.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isNewRole ? "Creating..." : "Saving..."}
                </>
              ) : (
                <>{isNewRole ? "Create Role" : "Save Changes"}</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
