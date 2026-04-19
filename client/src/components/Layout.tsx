import { Outlet, Link, useLocation } from "react-router-dom";
import { ShoppingCart, Store, Package, User, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/stores", icon: Store, label: "Stores" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function Layout() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <span>Smart Cart</span>
          </Link>
          {user && (
            <div className="ml-auto flex items-center gap-2">
              <Badge variant={user.reputation >= 0 ? "default" : "destructive"}>
                Rep: {user.reputation}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {user.name || user.email || "Guest"}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container px-4 py-6">
        <Outlet />
      </main>

      {/* Bottom navigation (mobile-first) */}
      <nav className="sticky bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to ||
              (item.to !== "/" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
