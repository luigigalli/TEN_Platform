import { Link } from "wouter";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "../hooks/use-user";
import type { User } from "@db/schema";

interface NavigationProps {
  user: User;
}

export default function Navigation({ user }: NavigationProps) {
  const { logout } = useUser();

  // Get user initials for avatar fallback
  const getUserInitials = (username: string) => {
    return username
      .split(' ')
      .map(part => part[0]?.toUpperCase() ?? '')
      .slice(0, 2)
      .join('');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4">
        <NavigationMenu className="py-4">
          <NavigationMenuList className="flex justify-between w-full">
            <div className="flex items-center gap-6">
              <NavigationMenuItem>
                <Link href="/">
                  <a className="text-xl font-bold text-primary hover:text-primary/90 transition-colors">
                    TEN
                  </a>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/services">
                  <Button 
                    variant="ghost"
                    aria-label="View Services"
                  >
                    Services
                  </Button>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/trips">
                  <Button 
                    variant="ghost"
                    aria-label="View Trip Planner"
                  >
                    Trip Planner
                  </Button>
                </Link>
              </NavigationMenuItem>
            </div>

            <div className="flex items-center gap-4">
              <NavigationMenuItem>
                <Link href="/profile">
                  <a className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                    <Avatar>
                      <AvatarImage 
                        src={user.avatar ?? undefined} 
                        alt={`${user.username}'s profile picture`}
                      />
                      <AvatarFallback>
                        {getUserInitials(user.username)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.username}</span>
                  </a>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  aria-label="Logout from your account"
                >
                  Logout
                </Button>
              </NavigationMenuItem>
            </div>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}