import React, { useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { User, LogOut, ChevronDown, LayoutDashboard, Users, Shield, Lock, Settings, FileText, Database } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "./ui/sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, logout } = useAuth();

  useEffect(() => {
    console.log('[AdminLayout] Mounted');
  }, []);

  if (!user) {
    console.log('[AdminLayout] No user found, not rendering');
    return null;
  }

  console.log('[AdminLayout] Rendering for user:', user);
  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex bg-background">
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader className="border-b px-6 py-3">
            <Link href="/admin">
              <h1 className="text-xl font-bold cursor-pointer">Admin Panel</h1>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Overview</SidebarGroupLabel>
              <Link href="/admin">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Access Management</SidebarGroupLabel>
              <Link href="/admin/users">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </Button>
              </Link>
              <Link href="/admin/roles">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Shield className="h-4 w-4" />
                  Roles
                </Button>
              </Link>
              <Link href="/admin/permissions">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Lock className="h-4 w-4" />
                  Permissions
                </Button>
              </Link>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>System</SidebarGroupLabel>
              <Link href="/admin/settings">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
              <Link href="/admin/logs">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <FileText className="h-4 w-4" />
                  Logs
                </Button>
              </Link>
              <Link href="/admin/database">
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Database className="h-4 w-4" />
                  Database
                </Button>
              </Link>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t p-4">
            <SidebarTrigger />
          </SidebarFooter>
        </Sidebar>

        {/* Main content */}
        <div className="flex-1">
          {/* Top bar */}
          <div className="border-b">
            <div className="flex h-16 items-center px-4 justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <span>{user?.firstName} {user?.lastName}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Page content */}
          <main className="p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};
