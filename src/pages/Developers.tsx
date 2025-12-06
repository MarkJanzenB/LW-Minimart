import { Navigation } from "@/components/Navigation";
import { useState, useEffect, useCallback } from "react";
import { Users, Code, Database, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

// Developer images
import AngeloCajegas from "@/assets/developers/Angelo_Cajegas.jpeg";
import AnamerahAbdullah from "@/assets/developers/Anamerah_Abdullah.jpeg";
import RichelleCandidato from "@/assets/developers/Richelle_Candidato.jpeg";
import LukeStanleyCastro from "@/assets/developers/Luke_Stanley_Castro.jpeg";
import LloydScottCabido from "@/assets/developers/Lloyd_Scott_Cabido.jpeg";
import ChristianBrentAlpez from "@/assets/developers/Christian_Brent_Alpez.jpeg";
import KristofferTesaluna from "@/assets/developers/Kristoffer_Tesaluna.jpg";
import JenniferBendoy from "@/assets/developers/Jennifer_Bendoy.jpeg";

interface Developer {
  name: string;
  role: string;
  image: string | null;
  category: "fullstack" | "frontend" | "backend";
  portfolio?: string;
}

const developers: Developer[] = [
  // Fullstack Developers
  { name: "Mark Bandola", role: "Fullstack Developer", image: null, category: "fullstack" },
  { name: "Angelo Cajegas", role: "Fullstack Developer", image: AngeloCajegas, category: "fullstack", portfolio: "https://angelocajegas.vercel.app/" },
  { name: "Anamerah Abdullah", role: "Fullstack Developer", image: AnamerahAbdullah, category: "fullstack" },
  // Frontend Developers
  { name: "Luke Stanley Castro", role: "Frontend Developer", image: LukeStanleyCastro, category: "frontend" },
  { name: "Christian Brent Alpez", role: "Frontend Developer", image: ChristianBrentAlpez, category: "frontend" },
  { name: "Jennifer Bendoy", role: "Frontend Developer", image: JenniferBendoy, category: "frontend" },
  { name: "Richelle Candidato", role: "Frontend Developer", image: RichelleCandidato, category: "frontend" },
  // Backend Developers
  { name: "Julianne Aban", role: "Backend Developer", image: null, category: "backend" },
  { name: "Kristoffer Tesaluna", role: "Backend Developer", image: KristofferTesaluna, category: "backend" },
  { name: "Donnalyn Topacio", role: "Backend Developer", image: null, category: "backend" },
  { name: "Lloyd Scott Cabido", role: "Backend Developer", image: LloydScottCabido, category: "backend" },
];

type FilterType = "all" | "fullstack" | "frontend" | "backend";

const DeveloperCard = ({ developer, isExpanded, onHover, onLeave, animationDelay = 0 }: { 
  developer: Developer; 
  isExpanded: boolean;
  onHover: () => void;
  onLeave: () => void;
  animationDelay?: number;
}) => {
  const handleCardClick = () => {
    if (developer.portfolio && isExpanded) {
      window.open(developer.portfolio, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl transition-all duration-500 ease-out ${developer.portfolio ? 'cursor-pointer' : 'cursor-default'} flex-shrink-0 animate-stagger-in`}
      style={{ animationDelay: `${animationDelay}ms` }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={handleCardClick}
    >
      <div className={`transition-all duration-500 ease-out ${isExpanded ? "w-[400px] md:w-[500px]" : "w-[200px] md:w-[240px]"}`}>
        {/* Card container */}
        <div className="relative h-[350px] md:h-[420px] rounded-2xl overflow-hidden border border-border/30 hover:border-primary/30 transition-all duration-500">
          
          {/* Background image - always visible */}
          <div className="absolute inset-0">
            {developer.image ? (
              <img
                src={developer.image}
                alt={developer.name}
                className={`w-full h-full object-cover object-top transition-all duration-500
                  ${isExpanded ? "blur-md scale-110 brightness-50" : ""}`}
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center transition-all duration-500
                ${isExpanded ? "blur-md brightness-50" : ""}`}>
                <div className="w-20 h-20 rounded-full bg-primary/30 flex items-center justify-center">
                  <Users className="w-10 h-10 text-primary" />
                </div>
              </div>
            )}
          </div>

          {/* Normal state overlay - gradient at bottom */}
          <div className={`absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent transition-opacity duration-500
            ${isExpanded ? "opacity-0" : "opacity-100"}`} />

          {/* Normal state content - bottom */}
          <div className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-500
            ${isExpanded ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>
            <h3 className="text-base font-bold text-foreground truncate">
              {developer.name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {developer.role}
            </p>
          </div>

          {/* Expanded state content - centered */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-all duration-500
            ${isExpanded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-2">
              {developer.name}
            </h3>
            <p className="text-base md:text-lg text-white/80 text-center mb-4">
              {developer.role}
            </p>
            {developer.portfolio && (
              <a
                href={developer.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                View Portfolio
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Border glow */}
          <div className={`absolute inset-0 rounded-2xl border transition-all duration-500
            ${isExpanded ? "border-primary/40 shadow-lg shadow-primary/20" : "border-transparent"}`} />
        </div>
      </div>
    </div>
  );
};

const DeveloperCarousel = ({ developers, filter }: { developers: Developer[]; filter: FilterType }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");
  const [animationKey, setAnimationKey] = useState(0);

  const filteredDevelopers = filter === "all" 
    ? developers 
    : developers.filter(dev => dev.category === filter);

  // Auto-advance carousel
  useEffect(() => {
    if (isPaused || hoveredIndex !== null) return;
    
    const interval = setInterval(() => {
      setSlideDirection("right");
      setIsSliding(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % filteredDevelopers.length);
        setAnimationKey((prev) => prev + 1);
        setIsSliding(false);
      }, 400);
    }, 4000);

    return () => clearInterval(interval);
  }, [filteredDevelopers.length, isPaused, hoveredIndex]);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [filter]);

  const goToNext = useCallback(() => {
    if (isSliding) return;
    setSlideDirection("right");
    setIsSliding(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredDevelopers.length);
      setAnimationKey((prev) => prev + 1);
      setIsSliding(false);
    }, 400);
  }, [filteredDevelopers.length, isSliding]);

  const goToPrev = useCallback(() => {
    if (isSliding) return;
    setSlideDirection("left");
    setIsSliding(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + filteredDevelopers.length) % filteredDevelopers.length);
      setAnimationKey((prev) => prev + 1);
      setIsSliding(false);
    }, 400);
  }, [filteredDevelopers.length, isSliding]);

  const goToSlide = useCallback((idx: number) => {
    if (isSliding || idx === currentIndex) return;
    setSlideDirection(idx > currentIndex ? "right" : "left");
    setIsSliding(true);
    setTimeout(() => {
      setCurrentIndex(idx);
      setAnimationKey((prev) => prev + 1);
      setIsSliding(false);
    }, 400);
  }, [currentIndex, isSliding]);

  // Get visible developers (show 4 at a time on desktop, 2 on mobile)
  const getVisibleDevelopers = () => {
    const result = [];
    for (let i = 0; i < Math.min(4, filteredDevelopers.length); i++) {
      const index = (currentIndex + i) % filteredDevelopers.length;
      result.push({ developer: filteredDevelopers[index], originalIndex: index });
    }
    return result;
  };

  const visibleDevelopers = getVisibleDevelopers();

  // Animation classes based on slide direction
  const getSlideAnimation = () => {
    if (!isSliding) return "translate-x-0 opacity-100";
    return slideDirection === "right" 
      ? "-translate-x-8 opacity-0" 
      : "translate-x-8 opacity-0";
  };

  return (
    <div 
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Navigation Buttons */}
      <button
        onClick={goToPrev}
        disabled={isSliding}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full glass-card hover:bg-primary/20 transition-all duration-300 -translate-x-4 md:translate-x-0 disabled:opacity-50"
        aria-label="Previous"
      >
        <ChevronLeft className="w-6 h-6 text-foreground" />
      </button>
      
      <button
        onClick={goToNext}
        disabled={isSliding}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full glass-card hover:bg-primary/20 transition-all duration-300 translate-x-4 md:translate-x-0 disabled:opacity-50"
        aria-label="Next"
      >
        <ChevronRight className="w-6 h-6 text-foreground" />
      </button>

      {/* Carousel Container */}
      <div className="flex justify-center items-center gap-4 md:gap-6 overflow-hidden px-12 py-4">
        <div className={`flex justify-center items-center gap-4 md:gap-6 transition-all duration-500 ease-out ${getSlideAnimation()}`}>
          {visibleDevelopers.map(({ developer, originalIndex }, idx) => (
            <DeveloperCard
              key={`${developer.name}-${originalIndex}-${animationKey}`}
              developer={developer}
              isExpanded={hoveredIndex === idx}
              onHover={() => setHoveredIndex(idx)}
              onLeave={() => setHoveredIndex(null)}
              animationDelay={idx * 100}
            />
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-8">
        {filteredDevelopers.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            disabled={isSliding}
            className={`h-2 rounded-full transition-all duration-500 ease-out disabled:cursor-wait
              ${idx === currentIndex 
                ? "bg-primary w-8 shadow-lg shadow-primary/30" 
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2"
              }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

const Developers = () => {
  const [filter, setFilter] = useState<FilterType>("all");

  const filters: { label: string; value: FilterType; icon: React.ReactNode }[] = [
    { label: "All Team", value: "all", icon: <Users className="w-4 h-4" /> },
    { label: "Fullstack", value: "fullstack", icon: <Code className="w-4 h-4" /> },
    { label: "Frontend", value: "frontend", icon: <Code className="w-4 h-4" /> },
    { label: "Backend", value: "backend", icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Meet Our <span className="gradient-text">Developers</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Passionate developers building innovative solutions for mini marts.
              <br />
              Get to know the talented team behind LW Mini Mart.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex glass-card rounded-full p-1.5 gap-1 flex-wrap justify-center">
              {filters.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  className={`
                    flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-sm font-medium transition-all duration-300
                    ${filter === item.value 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }
                  `}
                >
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Developers Carousel */}
          <DeveloperCarousel developers={developers} filter={filter} />

          {/* Stats Section */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold gradient-text mb-2">11</div>
              <div className="text-sm text-muted-foreground">Team Members</div>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold gradient-text mb-2">3</div>
              <div className="text-sm text-muted-foreground">Specializations</div>
            </div>
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold gradient-text mb-2">1</div>
              <div className="text-sm text-muted-foreground">Mission</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Developers;

