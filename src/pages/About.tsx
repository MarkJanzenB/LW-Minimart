import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto max-w-4xl px-4 py-20">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Our Story</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-12">
            Bridging the gap between tradition and technology
          </p>
          
          <div className="space-y-6">
            <Card className="glass-card">
              <CardContent className="pt-6 space-y-6 text-muted-foreground">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-3">The Problem We Saw</h2>
                  <p className="text-lg leading-relaxed">
                    LW Mini Mart was born from a simple observation: Neighborhood convenience stores are the heartbeat of our community, yet they often run on intuition and loose paper. Inventory runs out without warning, expired goods eat into profits, and "cash in hand" is often mistaken for actual profit.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-3">Our Solution</h2>
                  <p className="text-lg leading-relaxed">
                    We built LW Mini Mart to bridge the gap between tradition and technology. It isn&apos;t just a calculator; it is a Financial Command Center designed for the non-technical entrepreneur.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-3">What We Deliver</h2>
                  <p className="text-lg leading-relaxed">
                    By replacing guesswork with our &apos;Traffic Light&apos; Stock Alert System and ensuring Zero-Data-Loss with enterprise-grade storage, we give owners something money can&apos;t buy: Peace of mind.
                  </p>
                </div>

                <div className="pt-4">
                  <h2 className="text-2xl font-bold text-foreground mb-3">Our Mission</h2>
                  <p className="text-lg leading-relaxed font-medium text-foreground">
                    We empower the small entrepreneur to buy smart, sell fast, and grow steadily.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
