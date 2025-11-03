import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, ArrowRight, Star, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Vision Banner */}
      <div className="relative z-20 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-b border-primary/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4 md:py-5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-center">
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 font-bold text-xs whitespace-nowrap">
              FOUNDER REALITY SERIES
            </Badge>
            <p className="text-xs sm:text-sm md:text-base text-foreground/90 max-w-4xl leading-relaxed px-2">
              I turn founders into main characters—reality-style episodes that people actually want to watch.
            </p>
          </div>
        </div>
      </div>

      {/* Background */}
      <div className="absolute inset-0">
        <img 
          src={heroBg} 
          alt="Professional filmmaker in studio" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/95"></div>
        <div className="absolute inset-0 bg-gradient-hero/20"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 text-center max-w-5xl flex-1 flex flex-col justify-center py-8">
        {/* Badge */}
        <Badge variant="secondary" className="mb-12 md:mb-16 inline-flex items-center w-fit mx-auto animate-float bg-card/80 backdrop-blur-sm border-2 border-primary/30 text-foreground font-semibold px-4 py-2 shadow-lg">
          <Star className="w-4 h-4 mr-2 text-accent fill-accent" />
          100+ Founders. Real Stories. Zero BS.
        </Badge>
        
        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-8 md:mb-10 leading-[1.15] px-2 overflow-visible pb-4">
          I Turn Founders Into
          <span className="text-gradient block mt-2 pb-2">Main Characters.</span>
        </h1>
        
        {/* Subheadline */}
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
          Your story deserves better than stock footage and talking heads. Let's film your founder journey like the reality show it actually is.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center mb-10 md:mb-12 px-4">
          <Button 
            variant="hero" 
            size="lg" 
            className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-5 md:py-6 h-auto animate-glow-pulse"
            onClick={() => navigate('/booking-portal')}
          >
            <CreditCard className="mr-2 h-4 w-4 md:h-5 md:w-5" />
            Start Your Series
          </Button>

          <Button 
            variant="outline" 
            size="lg" 
            className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-5 md:py-6 h-auto"
            onClick={() => document.getElementById('lead-capture')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Talk to Eric
            <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
          </Button>
          
          <Button 
            variant="glass" 
            size="lg" 
            className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-5 md:py-6 h-auto"
            onClick={() => window.open('https://www.youtube.com/nvisionmg', '_blank')}
          >
            <Play className="mr-2 h-4 w-4 md:h-5 md:w-5" />
            Watch Episodes
          </Button>
        </div>

        {/* Quick Jump to Pricing */}
        <div className="mb-8">
          <button
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
          >
            Skip to pricing →
          </button>
        </div>
        
        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8 text-xs sm:text-sm text-muted-foreground px-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            <span className="whitespace-nowrap">2-Week Turnaround</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-secondary rounded-full"></div>
            <span className="whitespace-nowrap">Full-Service Production</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="whitespace-nowrap">Strategy Included</span>
          </div>
        </div>
      </div>
      
    </section>
  );
};

export default HeroSection;