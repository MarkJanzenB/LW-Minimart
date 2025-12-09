import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const OwnerSetup = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkOwner = async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).api?.auth) {
          const { hasOwner } = await (window as any).api.auth.hasOwner();
          if (hasOwner) {
            navigate("/signin");
          }
        }
      } catch (error) {
        console.error("Error checking owner status:", error);
      }
    };

    checkOwner();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await (window as any).api.auth.initializeOwner(username, password);

      if (!response.success) {
        throw new Error(response.message || "Unable to create owner account");
      }

      toast({
        title: "Owner initialized",
        description: "You can now sign in with your new owner account.",
      });
      navigate("/signin");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating owner account",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Video Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-[hsl(0,0%,10%)] relative overflow-hidden">
        {/* Video Background */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        >
          <source src="/auth-background.mp4" type="video/mp4" />
        </video>
        
        {/* Dark Overlay with Back Button */}
        <div className="absolute inset-0 bg-black/40">
          <Link
            to="/"
            className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-foreground shadow-lg transition hover:bg-white dark:bg-foreground/80 dark:text-background dark:hover:bg-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to landing
          </Link>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md">
          {/* Branding */}
          <div className="mb-8">
            <p className="text-sm text-muted-foreground">LW Mini Mart™</p>
            <p className="text-xs text-muted-foreground">Store Innovation Platform</p>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-semibold mb-4 text-foreground leading-tight">
            Create your owner account
          </h1>
          <p className="text-sm text-muted-foreground mb-12">
            This step runs only once. The owner account will have full access to all settings and reports.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm text-muted-foreground">
                Owner Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="owner01"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-12 bg-muted border-0 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-muted border-0 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm text-muted-foreground">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12 bg-muted border-0 rounded-lg"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-full bg-foreground hover:bg-foreground/90 text-background"
              >
                {loading ? "Creating owner..." : "Create Owner Account"}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-16">
            <p className="text-xs text-muted-foreground">www.lwminimart.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerSetup;
