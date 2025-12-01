import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, Trophy, Zap } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          navigate("/dashboard");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <h1 className="text-5xl md:text-7xl font-bold text-foreground">
                LW Mini Mart
                <span className="block text-primary mt-2">Hackathon 2025</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Build innovative solutions for the future of retail and e-commerce
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" onClick={() => navigate("/signin")}>
                  Register Now
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">48 Hours</h3>
                    <p className="text-sm text-muted-foreground">
                      Two full days of intensive coding and innovation
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">Team Building</h3>
                    <p className="text-sm text-muted-foreground">
                      Collaborate with talented developers and designers
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">Amazing Prizes</h3>
                    <p className="text-sm text-muted-foreground">
                      Win cash prizes and exciting opportunities
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">Mentorship</h3>
                    <p className="text-sm text-muted-foreground">
                      Learn from industry experts and mentors
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-20 px-4 bg-muted/50">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground">
                About the Hackathon
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                LW Mini Mart Hackathon brings together passionate developers, designers, and
                innovators to create cutting-edge solutions for modern retail challenges. Join us
                for an exciting weekend of learning, building, and networking with fellow
                tech enthusiasts.
              </p>
              <div className="pt-8">
                <Button size="lg" onClick={() => navigate("/signin")}>
                  Join the Challenge
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-border">
          <div className="container mx-auto text-center text-sm text-muted-foreground">
            <p>&copy; 2025 LW Mini Mart Hackathon. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;
