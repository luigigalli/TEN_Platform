import { Link } from "wouter";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

export default function Navigation() {
  const { user, logout } = useAuth();

  // Get user initials for avatar fallback
  const getUserInitials = (name: string | undefined | null) => {
    if (!name) return '';
    return name
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

  // If user is not loaded yet, don't render the navigation
  if (!user) {
    return null;
  }

  return (
    <header className="border-b">
      <div className="container mx-auto px-4">
        <NavigationMenu className="py-4">
          <NavigationMenuList className="flex justify-between w-full">
            <div className="flex items-center gap-6">
              <NavigationMenuItem>
                <Link href="/">
                  <span className="text-xl font-bold text-primary hover:text-primary/90 transition-colors cursor-pointer">
                    TEN
                  </span>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/services">
                  <Button 
                    variant="ghost"
                    aria-label="View Services"
                  >
                    <span className="text-sm font-medium hover:text-primary/90 transition-colors cursor-pointer">
                      Services
                    </span>
                  </Button>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/bookings">
                  <Button 
                    variant="ghost"
                    aria-label="View Bookings"
                  >
                    <span className="text-sm font-medium hover:text-primary/90 transition-colors cursor-pointer">
                      My Bookings
                    </span>
                  </Button>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/trips">
                  <Button 
                    variant="ghost"
                    aria-label="View Trip Planner"
                  >
                    <span className="text-sm font-medium hover:text-primary/90 transition-colors cursor-pointer">
                      Trip Planner
                    </span>
                  </Button>
                </Link>
              </NavigationMenuItem>
            </div>

            <div className="flex items-center gap-4">
              <NavigationMenuItem>
                <Link href="/profile">
                  <span className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer">
                    <Avatar>
                      <AvatarImage 
                        src={undefined} 
                        alt={`${user.firstName}'s profile picture`}
                      />
                      <AvatarFallback>
                        {getUserInitials(user.firstName + ' ' + user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.firstName}</span>
                  </span>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  aria-label="Logout from your account"
                >
                  <span className="text-sm font-medium hover:text-primary/90 transition-colors cursor-pointer">
                    Logout
                  </span>
                </Button>
              </NavigationMenuItem>
            </div>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}