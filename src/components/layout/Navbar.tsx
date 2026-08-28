import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Droplets, LogOut, Menu, User, Search, Home, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: supabaseUser, signOut } = useAuth();
  const currentUser = authService.getCurrentUser();
  const [open, setOpen] = useState(false);

  const isLoggedIn = Boolean(currentUser || supabaseUser);

  const handleLogout = async () => {
    authService.logout();
    await signOut();
    setOpen(false);
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    });
    navigate("/login");
  };

  const navLinks = isLoggedIn
    ? [
        { label: "Home", path: "/", icon: Home },
        { label: "My Profile", path: "/dashboard", icon: User },
        { label: "Search Donors", path: "/search", icon: Search },
      ]
    : [
        { label: "Home", path: "/", icon: Home },
        { label: "Search Donors", path: "/search", icon: Search },
        { label: "Login", path: "/login", icon: LogIn },
        { label: "Register", path: "/register", icon: UserPlus },
      ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2.5 min-h-[44px] min-w-[44px]">
          <Droplets className="h-7 w-7 text-accent" />
          <span className="font-bold text-lg tracking-tight">UAP Blood Bank</span>
        </Link>

        {/* Desktop Navigation (>= 768px) */}
        <nav className="hidden md:flex items-center gap-3">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link key={link.path} to={link.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="min-h-[44px] min-w-[44px] px-4 gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            );
          })}

          {isLoggedIn && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="min-h-[44px] min-w-[44px] px-4 gap-2 text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          )}
        </nav>

        {/* Mobile Navigation Drawer (< 768px) */}
        <div className="flex md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="min-h-[44px] min-w-[44px] rounded-lg"
                aria-label="Open Navigation Menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] p-6">
              <SheetHeader className="text-left border-b pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <Droplets className="h-7 w-7 text-accent" />
                  <SheetTitle className="font-bold text-lg">UAP Blood Bank</SheetTitle>
                </div>
              </SheetHeader>

              <div className="flex flex-col space-y-2 mt-4">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setOpen(false)}
                      className="w-full"
                    >
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className="w-full justify-start min-h-[44px] text-base gap-3 px-4 font-medium"
                      >
                        <Icon className="h-5 w-5" />
                        {link.label}
                      </Button>
                    </Link>
                  );
                })}

                {isLoggedIn && (
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="w-full justify-start min-h-[44px] text-base gap-3 px-4 mt-6 font-medium"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
