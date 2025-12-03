import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/lw-mini-mart-logo.png";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { user } = await window.api.auth.getCurrentUser();
        if (user) {
          navigate("/");
        }
      } catch (error) {
        console.error("Error checking current user:", error);
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await window.api.auth.login(email, password);

      if (!response.success) {
        throw new Error(response.message || "Invalid credentials");
      }

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: error.message || "Invalid email or password",
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
        
        {/* Logo at Bottom Left */}
        <div className="absolute bottom-8 left-8 z-10">
          <img src={logo} alt="LW Mini Mart" className="h-10" />
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
            Welcome, login to<br />your account.
          </h1>

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-muted-foreground">
                Username or Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            <div className="flex items-center justify-between pt-2">
              <Button 
                type="submit" 
                disabled={loading}
                className="h-12 px-8 rounded-full bg-foreground hover:bg-foreground/90 text-background"
              >
                {loading ? "Signing in..." : "Sign In Now"}
              </Button>
              
              <Link 
                to="/signup" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Create account?
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

export default SignIn;
