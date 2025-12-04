import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
        const { hasOwner } = await window.api.auth.hasOwner();
        if (hasOwner) {
          navigate("/signin");
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
      const response = await window.api.auth.initializeOwner(username, password);

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
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">LW Mini Mart Initial Setup</p>
          <h1 className="text-3xl font-semibold mt-2 text-foreground leading-tight">
            Create your owner account
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            This step runs only once. The owner account will have full access to all settings and reports.
          </p>
        </div>

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
      </div>
    </div>
  );
};

export default OwnerSetup;
