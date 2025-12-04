import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { AlertTriangle, Shield, TrendingUp, Package, DollarSign, BarChart3, Zap, CheckCircle, Layers, Bell, Cloud, RefreshCw, LineChart, Mail, Phone, MessageSquare, HelpCircle, Send } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { z } from "zod";
import heroDashboard from "@/assets/hero-dashboard.jpg";
import storeOwner from "@/assets/store-owner.jpg";
import trafficAlertsPro from "@/assets/traffic-alerts-pro.jpg";
import dataProtectionPro from "@/assets/data-protection-pro.jpg";
import profitAnalyticsPro from "@/assets/profit-analytics-pro.jpg";
import smartInventory from "@/assets/smart-inventory.jpg";
import lwLogo from "@/assets/lw-logo.jpg";

const contactSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }).max(100, { message: "Name must be less than 100 characters" }),
  email: z.string().trim().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" }),
  phone: z.string().trim().max(20, { message: "Phone must be less than 20 characters" }).optional(),
  message: z.string().trim().min(1, { message: "Message is required" }).max(1000, { message: "Message must be less than 1000 characters" })
});

interface FeatureCardProps {
  image: string;
  icon: React.ElementType;
  title: string;
  description: string;
  iconBgColor: string;
  iconColor: string;
  glowClass: string;
  gradientFrom: string;
  gradientTo: string;
  delay: number;
}

const FeatureCard = ({ image, icon: Icon, title, description, iconBgColor, iconColor, glowClass, gradientFrom, gradientTo, delay }: FeatureCardProps) => {
  const { ref, isVisible } = useScrollAnimation(0.2);
  
  return (
    <div
      ref={ref}
      className={`glass-card rounded-3xl overflow-hidden ${glowClass} transition-all duration-500 group ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ 
        transitionDelay: isVisible ? `${delay}ms` : '0ms'
      }}
    >
      <div className={`relative h-64 overflow-hidden bg-gradient-to-br ${gradientFrom} ${gradientTo}`}>
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
        <div className="absolute bottom-6 left-6">
          <div className={`w-16 h-16 rounded-2xl ${iconBgColor} backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-8 h-8 ${iconColor}`} />
          </div>
        </div>
      </div>
      <div className="p-8">
        <h3 className="font-bold text-2xl mb-3 text-foreground">{title}</h3>
        <p className="text-muted-foreground leading-relaxed text-lg">
          {description}
        </p>
      </div>
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeTab, setActiveTab] = useState("Inventory");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  useEffect(() => {
    const checkOwnerOnLoad = async () => {
      try {
        const { hasOwner } = await window.api.auth.hasOwner();
        if (hasOwner) {
          navigate("/signin");
        }
      } catch (error) {
        console.error("Error checking owner state:", error);
      }
    };

    checkOwnerOnLoad();
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validatedData = contactSchema.parse(formData);
      
      // Simulate form submission (you can integrate with email service here)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you as soon as possible.",
      });
      
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetStarted = async () => {
    try {
      const { hasOwner } = await window.api.auth.hasOwner();
      if (!hasOwner) {
        navigate("/owner-setup");
        return;
      }

      navigate("/signin");
    } catch (error) {
      console.error("Error handling get started:", error);
      navigate("/signin");
    }
  };

  return (
    <div className="min-h-screen overflow-hidden relative">
      <Navigation />
      
      {/* Video Background */}
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/background-video.mp4" type="video/mp4" />
        </video>
        {/* Lighter overlay to show video better */}
        <div className="absolute inset-0 bg-background/70 dark:bg-background/85" />
      </div>

      {/* All content with relative positioning to appear above video */}
      <div className="relative z-10">
      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center space-y-8 animate-fade-in-up">
            {/* Beta Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-foreground/5 dark:bg-foreground/10 border border-foreground/10">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-foreground/80 font-medium">LW Mini Mart is now in beta</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05]">
              <span className="text-foreground">LW Mini Mart</span>
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Smart Inventory</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-foreground/60 max-w-3xl mx-auto leading-relaxed font-normal">
              Our landing page template works on all devices, so you only have to set it up once,
              and get beautiful results forever.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-base px-8 h-12 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200"
                onClick={handleGetStarted}
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="ghost"
                className="bg-foreground/5 hover:bg-foreground/10 text-foreground text-base px-8 h-12 rounded-xl border border-foreground/10 hover:border-foreground/20 transition-all duration-200 font-medium"
                onClick={() => navigate("/about")}
              >
                Read the docs
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-24 px-4 border-y border-foreground/5 overflow-hidden bg-gradient-to-b from-background via-accent/5 to-background">
        <div className="container mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              It's How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
              Our platform revolutionizes convenience store management with AI-powered insights and real-time monitoring
            </p>
          </div>

          {/* Video Showcase */}
          <div className="flex justify-center mb-16">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full max-w-3xl rounded-2xl shadow-2xl border border-foreground/10"
            >
              <source src="/company-showcase.mp4" type="video/mp4" />
            </video>
          </div>

          {/* Key Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur border border-foreground/5 hover:border-primary/20 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Inventory</h3>
              <p className="text-muted-foreground">
                Track stock levels in real-time with AI predictions to prevent shortages and optimize ordering
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur border border-foreground/5 hover:border-primary/20 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Profit Analytics</h3>
              <p className="text-muted-foreground">
                Comprehensive financial insights with trend analysis to maximize revenue and identify opportunities
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur border border-foreground/5 hover:border-primary/20 transition-all duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Security & Alerts</h3>
              <p className="text-muted-foreground">
                24/7 monitoring with instant alerts for suspicious activity and data protection compliance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="py-32 px-4 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <p className="text-sm text-foreground/50 uppercase tracking-wider font-semibold">
                  The security first platform
                </p>
                <h2 className="text-5xl md:text-6xl font-bold leading-[1.1]">
                  <span className="text-foreground">Simplify your security</span>{" "}
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">with authentication</span>{" "}
                  <span className="text-foreground">services</span>
                </h2>
                <p className="text-lg text-foreground/60 leading-relaxed font-normal">
                  Define access roles for the end-users, and extend your authorization capabilities
                  to implement dynamic access control.
                </p>
              </div>

              {/* Feature List */}
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-3 bg-foreground/5 dark:bg-foreground/5 p-4 rounded-xl border border-foreground/5 hover:border-foreground/10 transition-colors duration-200">
                  <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Simplify your security</span>
                </div>
                <div className="flex items-center gap-3 bg-foreground/5 dark:bg-foreground/5 p-4 rounded-xl border border-foreground/5 hover:border-foreground/10 transition-colors duration-200">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Extreme Security</span>
                </div>
                <div className="flex items-center gap-3 bg-foreground/5 dark:bg-foreground/5 p-4 rounded-xl border border-foreground/5 hover:border-foreground/10 transition-colors duration-200">
                  <Layers className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Adaptable authentication</span>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative flex items-center justify-center min-h-[500px]">
              <div className="glass-card rounded-3xl p-20 relative hover:scale-105 transition-transform duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl" />
                <div className="relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                    <Zap className="w-16 h-16 text-primary-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="py-32 px-4 relative border-y border-foreground/5 bg-gradient-to-b from-background via-accent/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <p className="text-sm text-primary uppercase tracking-wider font-semibold">
                  DATA-DRIVEN INSIGHTS
                </p>
                <h2 className="text-5xl md:text-6xl font-bold leading-[1.1]">
                  <span className="text-foreground">Transform Data into</span>{" "}
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Actionable Insights</span>
                </h2>
                <p className="text-lg text-foreground/60 leading-relaxed font-normal">
                  Make informed decisions with comprehensive analytics that track sales trends, customer behavior, and inventory performance. 
                  Our AI-powered analytics platform helps you identify opportunities, optimize pricing, and maximize profitability with real-time data visualization.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-3 bg-foreground/5 p-4 rounded-xl border border-foreground/5 hover:border-primary/20 transition-colors duration-200">
                  <BarChart3 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Real-time sales tracking and revenue analysis</span>
                </div>
                <div className="flex items-center gap-3 bg-foreground/5 p-4 rounded-xl border border-foreground/5 hover:border-primary/20 transition-colors duration-200">
                  <TrendingUp className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Predictive analytics for inventory optimization</span>
                </div>
                <div className="flex items-center gap-3 bg-foreground/5 p-4 rounded-xl border border-foreground/5 hover:border-primary/20 transition-colors duration-200">
                  <LineChart className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Custom reports and performance dashboards</span>
                </div>
              </div>
            </div>

            {/* Right Video */}
            <div className="relative">
              <div className="glass-card rounded-3xl overflow-hidden border border-foreground/10 shadow-2xl hover:shadow-primary/20 transition-shadow duration-500">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="/analytics-demo.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-32 px-4 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Left Video */}
            <div className="relative lg:order-1">
              <div className="glass-card rounded-3xl overflow-hidden border border-foreground/10 shadow-2xl hover:shadow-primary/20 transition-shadow duration-500">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="/security-demo.mp4" type="video/mp4" />
                </video>
              </div>
            </div>

            {/* Right Content */}
            <div className="space-y-8 lg:order-2">
              <div className="space-y-6">
                <p className="text-sm text-primary uppercase tracking-wider font-semibold">
                  THE SECURITY FIRST PLATFORM
                </p>
                <h2 className="text-5xl md:text-6xl font-bold leading-[1.1]">
                  <span className="text-foreground">Protect Your Business</span>{" "}
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">24/7</span>
                </h2>
                <p className="text-lg text-foreground/60 leading-relaxed font-normal">
                  Advanced security monitoring with AI-powered threat detection keeps your store safe around the clock. 
                  Get instant alerts for suspicious activity, unauthorized access, and potential security breaches, all managed through a single, intuitive dashboard.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-3 bg-foreground/5 p-4 rounded-xl border border-foreground/5 hover:border-primary/20 transition-colors duration-200">
                  <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">24/7 real-time video surveillance</span>
                </div>
                <div className="flex items-center gap-3 bg-foreground/5 p-4 rounded-xl border border-foreground/5 hover:border-primary/20 transition-colors duration-200">
                  <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Instant threat detection and alerts</span>
                </div>
                <div className="flex items-center gap-3 bg-foreground/5 p-4 rounded-xl border border-foreground/5 hover:border-primary/20 transition-colors duration-200">
                  <Cloud className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Secure cloud storage and data encryption</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inventory Section */}
      <section className="py-32 px-4 relative border-y border-foreground/5 bg-gradient-to-b from-background via-accent/5 to-background">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <p className="text-sm text-primary uppercase tracking-wider font-semibold">
                  SMART INVENTORY MANAGEMENT
                </p>
                <h2 className="text-5xl md:text-6xl font-bold leading-[1.1]">
                  <span className="text-foreground">Never Run Out of</span>{" "}
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Popular Items</span>
                </h2>
                <p className="text-lg text-foreground/60 leading-relaxed font-normal">
                  AI-powered inventory tracking that predicts demand, prevents stockouts, and optimizes reordering. 
                  Get real-time visibility into your stock levels, receive low-stock alerts, and make data-driven purchasing decisions that keep your shelves perfectly stocked.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-3 bg-foreground/5 p-4 rounded-xl border border-foreground/5 hover:border-primary/20 transition-colors duration-200">
                  <Package className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Automated stock level monitoring</span>
                </div>
                <div className="flex items-center gap-3 bg-foreground/5 p-4 rounded-xl border border-foreground/5 hover:border-primary/20 transition-colors duration-200">
                  <Bell className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Smart reorder recommendations</span>
                </div>
                <div className="flex items-center gap-3 bg-foreground/5 p-4 rounded-xl border border-foreground/5 hover:border-primary/20 transition-colors duration-200">
                  <RefreshCw className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground font-medium">Real-time sync across all channels</span>
                </div>
              </div>
            </div>

            {/* Right Video */}
            <div className="relative">
              <div className="glass-card rounded-3xl overflow-hidden border border-foreground/10 shadow-2xl hover:shadow-primary/20 transition-shadow duration-500">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="/inventory-demo.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase Section */}
      <section className="py-32 px-4 relative">
        <div className="container mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-left mb-16 space-y-6">
            <h2 className="text-5xl md:text-6xl font-bold leading-[1.1]">
              <span className="text-foreground">Few more things</span>
              <br />
              <span className="text-foreground">you're going to love</span>
            </h2>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-8 mb-16 border-b border-foreground/10">
            {["Inventory", "Analytics", "Alerts", "Reports"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-base font-medium transition-colors duration-200 ${
                  activeTab === tab
                    ? 'text-foreground border-b-2 border-primary' 
                    : 'text-foreground/40 hover:text-foreground/60'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Left Feature Card - Dynamic Content */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-3xl p-10 space-y-8 border border-primary/20 backdrop-blur-xl">
                {activeTab === "Inventory" && (
                  <>
                    <h3 className="text-3xl font-semibold text-foreground">Smart Inventory Management</h3>
                    <p className="text-foreground/70 leading-relaxed text-lg font-normal">
                      Track stock levels in real-time with automated alerts and data-driven insights to keep your shelves optimally stocked.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground/90 font-medium">Real-time stock tracking</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground/90 font-medium">Low stock alerts</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground/90 font-medium">Sales trend analysis</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground/90 font-medium">Automated reorder points</span>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "Analytics" && (
                  <>
                    <h3 className="text-3xl font-semibold text-foreground">Powerful Analytics Dashboard</h3>
                    <p className="text-foreground/70 leading-relaxed text-lg font-normal">
                      Make data-driven decisions with comprehensive sales analytics, profit tracking, and customer insights at your fingertips.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground/90 font-medium">Daily sales reports</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground/90 font-medium">Profit margin analysis</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground/90 font-medium">Best-selling products</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground/90 font-medium">Customer spending patterns</span>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "Alerts" && (
                  <>
                    <h3 className="text-3xl font-semibold text-foreground">Traffic Light Alert System</h3>
                    <p className="text-foreground/70 leading-relaxed text-lg font-normal">
                      Stay ahead of stockouts with color-coded alerts. Green means healthy stock, yellow warns of low levels, and red signals immediate action needed.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground/90 font-medium">Visual stock indicators</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground/90 font-medium">Instant notifications</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground/90 font-medium">Custom alert thresholds</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground/90 font-medium">Multi-channel alerts</span>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "Reports" && (
                  <>
                    <h3 className="text-3xl font-semibold text-foreground">Comprehensive Business Reports</h3>
                    <p className="text-foreground/70 leading-relaxed text-lg font-normal">
                      Generate detailed reports that distinguish between cash flow and true profit, giving you complete visibility into your business performance.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground/90 font-medium">Profit vs. cash analysis</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground/90 font-medium">Inventory valuation</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground/90 font-medium">Expense tracking</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-foreground/90 font-medium">Export to Excel/PDF</span>
                      </div>
                    </div>
                  </>
                )}

                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 h-11 rounded-xl font-medium"
                  onClick={handleGetStarted}
                >
                  Get Started →
                </Button>
              </div>
            </div>

            {/* Right Visual - Feature Pills */}
            <div className="relative flex items-center justify-center min-h-[600px]">
              <div className="relative w-full max-w-md">
                {/* Background gradient card */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-3xl blur-3xl" />
                
                {/* Stacked feature items */}
                <div className="relative space-y-4 p-8">
                  <div className="bg-background/80 dark:bg-foreground/10 backdrop-blur-xl rounded-2xl p-5 flex items-center gap-4 border border-foreground/10 hover:border-primary/30 transition-all duration-300 hover:scale-105">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-foreground font-semibold text-lg">Sales Analytics</span>
                  </div>
                  
                  <div className="bg-background/80 dark:bg-foreground/10 backdrop-blur-xl rounded-2xl p-5 flex items-center gap-4 border border-foreground/10 hover:border-primary/30 transition-all duration-300 hover:scale-105">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-foreground font-semibold text-lg">Stock Management</span>
                  </div>
                  
                  <div className="bg-background/80 dark:bg-foreground/10 backdrop-blur-xl rounded-2xl p-5 flex items-center gap-4 border border-foreground/10 hover:border-primary/30 transition-all duration-300 hover:scale-105">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bell className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-foreground font-semibold text-lg">Alert System</span>
                  </div>
                  
                  <div className="bg-background/80 dark:bg-foreground/10 backdrop-blur-xl rounded-2xl p-5 flex items-center gap-4 border border-foreground/10 hover:border-primary/30 transition-all duration-300 hover:scale-105">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-foreground font-semibold text-lg">Profit Reports</span>
                  </div>
                  
                  <div className="bg-background/80 dark:bg-foreground/10 backdrop-blur-xl rounded-2xl p-5 flex items-center gap-4 border border-foreground/10 hover:border-primary/30 transition-all duration-300 hover:scale-105">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Cloud className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-foreground font-semibold text-lg">Cloud Backup</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full text-sm mb-6">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-foreground/80">Common Questions</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="gradient-text">Frequently Asked</span>
              <br />
              <span className="text-foreground">Questions</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about LW Mini Mart
            </p>
          </div>

          <div className="glass-card rounded-3xl p-8 md:p-12">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-border/50">
                <AccordionTrigger className="text-left text-lg font-semibold text-foreground hover:text-primary">
                  What is LW Mini Mart?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  LW Mini Mart is a comprehensive inventory management system designed specifically for neighborhood stores. 
                  We help you track stock levels, manage purchases, monitor profits, and make data-driven decisions—all without requiring technical expertise.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-border/50">
                <AccordionTrigger className="text-left text-lg font-semibold text-foreground hover:text-primary">
                  How does the Traffic Light Alert system work?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Our Traffic Light system uses three color-coded alerts: Green means your stock is healthy, Yellow warns you when items are running low, 
                  and Red alerts you when products need immediate restocking. This visual system helps you maintain optimal inventory levels without constant manual checking.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-border/50">
                <AccordionTrigger className="text-left text-lg font-semibold text-foreground hover:text-primary">
                  Is my data secure?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Absolutely. We use enterprise-grade cloud storage with automatic backups, ensuring zero data loss. 
                  Your information is encrypted and protected with industry-standard security measures. You can access your data anytime, from anywhere, with complete peace of mind.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border-border/50">
                <AccordionTrigger className="text-left text-lg font-semibold text-foreground hover:text-primary">
                  Do I need technical knowledge to use this?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Not at all! LW Mini Mart is designed for store owners, not tech experts. Our intuitive interface makes it easy to manage your inventory, 
                  track profits, and view analytics—no technical background required. Our web-based platform is accessible from any device with a browser.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border-border/50">
                <AccordionTrigger className="text-left text-lg font-semibold text-foreground hover:text-primary">
                  What's the difference between cash in hand and actual profit?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Cash in hand is the money you have available, while actual profit accounts for your inventory costs, expenses, and outstanding payments. 
                  LW Mini Mart tracks both separately, giving you a clear picture of your true financial position and helping you make smarter business decisions.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full text-sm mb-6">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-foreground/80">Get in Touch</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="gradient-text">Contact Us</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="glass-card rounded-3xl p-8 hover:glow-primary transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground mb-2">Email Us</h3>
                    <p className="text-muted-foreground mb-2">Our team is here to help</p>
                    <a href="mailto:support@lwminimart.com" className="text-primary hover:underline">
                      support@lwminimart.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-3xl p-8 hover:glow-accent transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground mb-2">Call Us</h3>
                    <p className="text-muted-foreground mb-2">Mon-Fri from 9am to 6pm</p>
                    <a href="tel:+1234567890" className="text-primary hover:underline">
                      +1 (234) 567-890
                    </a>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-3xl p-8 hover:glow-primary transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground mb-2">Live Chat</h3>
                    <p className="text-muted-foreground mb-2">Available during business hours</p>
                    <button className="text-primary hover:underline">
                      Start a conversation
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="glass-card rounded-3xl p-8 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-background/50 border-border/50 focus:border-primary"
                    required
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-background/50 border-border/50 focus:border-primary"
                    required
                    maxLength={255}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (234) 567-890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-background/50 border-border/50 focus:border-primary"
                    maxLength={20}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-foreground">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us how we can help you..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="bg-background/50 border-border/50 focus:border-primary min-h-[150px]"
                    required
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.message.length}/1000 characters
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full glass-card hover:glow-primary text-lg py-6 rounded-2xl text-foreground font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="glass-card rounded-[3rem] p-12 md:p-16 glow-accent">
            <Package className="w-16 h-16 mx-auto mb-6 text-accent animate-float" />
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="gradient-text">Ready to Transform</span>
              <br />
              <span className="text-foreground">Your Store?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of neighborhood stores that have replaced guesswork with confidence. Get started today and experience the peace of mind you deserve.
            </p>
            <Button 
              size="lg"
              className="glass-card hover:glow-primary text-lg px-12 py-6 rounded-2xl text-foreground font-semibold"
              onClick={() => navigate("/signin")}
            >
              <TrendingUp className="w-5 h-5" />
              Start Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-foreground/5">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-center space-y-6">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <img 
                src={lwLogo} 
                alt="LW Mini Mart" 
                className="w-10 h-10 rounded-lg object-cover transition-transform duration-300 group-hover:scale-110" 
              />
              <span className="font-bold text-lg text-foreground transition-colors duration-300 group-hover:text-primary">LW Mini Mart</span>
            </Link>
            
            {/* Copyright */}
            <p className="text-sm text-foreground/40 font-normal">
              &copy; 2025 LW Mini Mart. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
};

export default Index;
