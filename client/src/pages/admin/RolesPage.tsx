import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Settings } from "lucide-react";
import { RoleListItem, RoleType } from "@/types/role";

export default function RolesPage() {
  // Fetch roles
  const { data: roles = [], isLoading, isError } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await fetch('/api/roles');
      if (!response.ok) throw new Error('Failed to fetch roles');
      return response.json();
    },
    retry: 1,
    refetchOnWindowFocus: false,
    initialData: [],
  });

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
        <p className="text-red-500">Failed to load roles. Please try again.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Roles</h1>
          <p className="text-muted-foreground">
            Manage user roles and their permissions
          </p>
        </div>
        <Link href="/admin/roles/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </Link>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No roles found. Create your first role to get started.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role: RoleListItem) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <span>{role.name}</span>
                      {role.isSystem && (
                        <Badge variant="secondary" className="ml-2">
                          System
                        </Badge>
                      )}
                    </div>
                    {role.description && (
                      <span className="text-sm text-muted-foreground block">
                        {role.description}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {role.type === RoleType.SYSTEM ? 'System' : 'Custom'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{role.userCount || 0} users</Badge>
                  </TableCell>
                  <TableCell>
                    {role.permissions.length} permissions
                  </TableCell>
                  <TableCell>
                    {new Date(role.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/roles/${role.id}`}>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">Edit role</span>
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
