import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import lwLogo from "@/assets/lw-logo.jpg";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const handleGetStarted = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      // Check if owner exists or if database is missing
      const { hasOwner } = await (window as any).api.auth.hasOwner();
      
      // If owner doesn't exist OR database is missing (error case), go to owner-setup
      // Otherwise, go to login
      if (!hasOwner) {
        navigate("/owner-setup");
      } else {
        navigate("/signin");
      }
    } catch (error) {
      // If there's an error (e.g., database missing), redirect to owner-setup
      console.error("Error handling get started:", error);
      navigate("/owner-setup");
    }
  };

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/developers", label: "Developers" },
  ];

  return (
    <nav className="fixed top-0 w-full bg-card/80 backdrop-blur-md border-b border-border z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src={lwLogo} 
              alt="LW Mini Mart" 
              className="w-12 h-12 rounded-lg object-cover transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg" 
            />
            <span className="font-bold text-xl text-foreground transition-colors duration-300 group-hover:text-primary">LW Mini Mart</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  isActive(link.path) ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={handleGetStarted}>Get Started</Button>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary px-2 py-1",
                    isActive(link.path) ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4">
                <Button 
                  className="w-full" 
                  onClick={(e) => {
                    setIsOpen(false);
                    handleGetStarted(e);
                  }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
