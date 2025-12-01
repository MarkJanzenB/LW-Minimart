import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background pt-16">
        <div className="container mx-auto max-w-4xl px-4 py-20">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
            About LW Mini Mart Hackathon
          </h1>
          <Card>
            <CardContent className="pt-6 space-y-4 text-muted-foreground">
              <p className="text-lg">
                LW Mini Mart Hackathon is a premier event bringing together innovative minds to
                solve real-world challenges in the retail and e-commerce space.
              </p>
              <p>
                Our mission is to foster creativity, collaboration, and technological advancement
                in the retail industry through hands-on development and mentorship.
              </p>
              <p>
                Whether you're a seasoned developer or just starting your journey, this hackathon
                offers an incredible opportunity to learn, build, and connect with like-minded
                individuals.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default About;
