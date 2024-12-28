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

export default function Navigation({ user }: { user: User }) {
  const { logout } = useUser();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4">
        <NavigationMenu className="py-4">
          <NavigationMenuList className="flex justify-between w-full">
            <div className="flex items-center gap-6">
              <NavigationMenuItem>
                <Link href="/">
                  <span className="text-xl font-bold text-primary cursor-pointer">
                    TEN
                  </span>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/trips">
                  <Button variant="ghost">Trip Planner</Button>
                </Link>
              </NavigationMenuItem>
            </div>

            <div className="flex items-center gap-4">
              <NavigationMenuItem>
                <Link href="/profile">
                  <div className="flex items-center gap-2 cursor-pointer">
                    <Avatar>
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.username}</span>
                  </div>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Button variant="ghost" onClick={() => logout()}>
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
