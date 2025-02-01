import { useState } from "react";
import { Link, useLocation, Switch, Route } from "wouter";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "@/lib/utils";
import DashboardPage from "@/pages/admin/DashboardPage";
import UsersPage from "@/pages/admin/UsersPage";
import RolesPage from "@/pages/admin/RolesPage"; // Add this line
import {
  LayoutDashboard,
  Users,
  Menu,
  User,
  LogOut,
  Shield,
  ChevronDown,
} from "lucide-react";

interface MenuItem {
  href: string;
  icon: React.ElementType;
  label: string;
  subItems?: MenuItem[];
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === '/admin' && location === '/admin') return true;
    if (href !== '/admin' && location.startsWith(href)) return true;
    return false;
  };

  const menuItems: MenuItem[] = [
    {
      href: "/admin",
      icon: LayoutDashboard,
      label: "Dashboard"
    },
    {
      href: "/admin/users",
      icon: Users,
      label: "User Management",
      subItems: [
        {
          href: "/admin/users",
          icon: Users,
          label: "Users List"
        },
        {
          href: "/admin/roles",
          icon: Shield,
          label: "Roles"
        }
      ]
    }
  ];

  const toggleSubMenu = (href: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [href]: !prev[href]
    }));
  };

  const renderMenuItem = (item: MenuItem) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isOpen = openMenus[item.href];

    if (hasSubItems) {
      return (
        <div key={item.href}>
          <button
            onClick={() => toggleSubMenu(item.href)}
            className={cn(
              "flex items-center w-full px-3 py-2 text-sm font-medium rounded-md",
              active
                ? "text-foreground bg-accent"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            <Icon className="h-5 w-5 mr-3" />
            <span className="flex-1">{item.label}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                isOpen && "transform rotate-180"
              )}
            />
          </button>
          {isOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {item.subItems.map((subItem) => (
                <Link key={subItem.href} href={subItem.href}>
                  <div
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
                      isActive(subItem.href)
                        ? "text-foreground bg-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <subItem.icon className="h-5 w-5 mr-3" />
                    <span>{subItem.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={item.href}>
        <Link href={item.href}>
          <div
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer",
              active
                ? "text-foreground bg-accent"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            <Icon className="h-5 w-5 mr-3" />
            <span>{item.label}</span>
          </div>
        </Link>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          !isSidebarOpen && "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <span className="text-lg font-semibold">Admin Panel</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {menuItems.map(renderMenuItem)}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-40 border-b bg-background">
          <div className="flex items-center justify-between h-16 px-4">
            <Button
              variant="ghost"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>

            <div className="flex items-center space-x-4 ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/profile/${user?.id}`}>
                      <div className="flex items-center w-full">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="p-6">
          <Switch>
            <Route path="/admin" exact>
              <DashboardPage />
            </Route>
            <Route path="/admin/users">
              <UsersPage />
            </Route>
            <Route path="/admin/roles">
              <RolesPage />
            </Route>
            <Route>
              <DashboardPage />
            </Route>
          </Switch>
        </main>
      </div>
    </div>
  );
}
