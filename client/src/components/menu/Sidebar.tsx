import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useMenu } from "@/contexts/MenuContext";
import {
  LayoutDashboard,
  Users,
  Shield,
  Lock,
  ChevronDown,
  Menu as MenuIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    title: "Users",
    icon: Users,
    href: "/admin/users",
  },
  {
    title: "Roles",
    icon: Shield,
    href: "/admin/roles",
  },
  {
    title: "Permissions",
    icon: Lock,
    href: "/admin/permissions",
  },
];

export const Sidebar = () => {
  const [location] = useLocation();
  const { state, dispatch } = useMenu();

  console.log('[Sidebar] Current location:', location);
  console.log('[Sidebar] Menu state:', state);

  const toggleSidebar = () => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  };

  return (
    <>
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={toggleSidebar}
      >
        <MenuIcon className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out md:translate-x-0",
          state.isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/admin">
            <h1 className="text-xl font-bold cursor-pointer">Admin Panel</h1>
          </Link>
        </div>

        {/* Menu items */}
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="px-3 py-2">
            {menuItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2 mb-1",
                      isActive && "bg-secondary"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Button>
                </Link>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Mobile overlay */}
      {state.isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};
