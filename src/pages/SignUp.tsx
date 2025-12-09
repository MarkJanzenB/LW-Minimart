import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/lw-mini-mart-logo.png";

const SignUp = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUserAndOwner = async () => {
      try {
        const { hasOwner } = await window.api.auth.hasOwner();
        if (!hasOwner) {
          navigate("/owner-setup");
          return;
        }

        const { user } = await window.api.auth.getCurrentUser();
        if (user) {
          navigate("/");
        }
      } catch (error) {
        console.error("Error checking current user:", error);
      }
    };
    checkUserAndOwner();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
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
      const response = await window.api.auth.register(username, password);

      if (!response.success) {
        throw new Error(response.message || "Unable to create account");
      }

      toast({
        title: "Account created!",
        description: "You can now sign in with your credentials.",
      });
      navigate("/signin");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating account",
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
          <h1 className="text-4xl font-semibold mb-12 text-foreground leading-tight">
            Get started, create<br />your account.
          </h1>

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm text-muted-foreground">
                Username
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
                placeholder="Your Password"
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

            <div className="flex items-center justify-between pt-2">
              <Button 
                type="submit" 
                disabled={loading}
                className="h-12 px-8 rounded-full bg-foreground hover:bg-foreground/90 text-background"
              >
                {loading ? "Creating account..." : "Sign Up Now"}
              </Button>
              
              <Link 
                to="/signin" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Already have account?
              </Link>
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

export default SignUp;
