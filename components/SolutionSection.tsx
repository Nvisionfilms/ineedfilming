import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Users, TrendingUp, CheckCircle, ArrowRight } from "lucide-react";

const services = [
  {
    icon: Video,
    title: "Founder Reality Pieces",
    description: "Day-in-the-life meets brand purpose. Capture the real moments behind your business in documentary-style episodes.",
    features: ["Unscripted authenticity", "Cinematic production", "Weekly content rollout", "Social + website formats"],
    badge: "Most Popular"
  },
  {
    icon: Users,
    title: "Branded Mini-Series",
    description: "Episodic storytelling that builds loyalty. Think reality show meets your brand—keeping people coming back.",
    features: ["Multi-episode campaigns", "Behind-the-scenes reels", "Customer journey stories", "Paid ad versions"],
    badge: null
  },
  {
    icon: TrendingUp,
    title: "Team Culture Docs",
    description: "The Office meets your company. Show the real people, real culture, and real passion behind what you do.",
    features: ["Multi-day filming", "Team + customer stories", "Culture-first content", "Strategic story arc"],
    badge: null
  }
];

const SolutionSection = () => {
  return (
    <section id="services" className="py-12 bg-gradient-to-b from-muted/20 to-background">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 px-2">
            Turn Your Brand Into A Series
            <span className="text-gradient block mt-1">People Actually Follow</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4 mb-8">
            Reality-style episodes that build connection over time. Not one-off posts—ongoing stories that keep audiences coming back.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground mb-12">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span>4x More Engagement</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-secondary rounded-full"></div>
              <span>Builds Loyalty</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Strategy Included</span>
            </div>
          </div>
        </div>
        
        {/* Services Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className="p-8 card-cinematic bg-gradient-card border-border/50 hover:border-primary/30 relative overflow-hidden"
            >
              {service.badge && (
                <Badge 
                  variant="secondary" 
                  className="absolute top-6 right-6 bg-accent/20 text-accent border-accent/30"
                >
                  {service.badge}
                </Badge>
              )}
              
              <div className="space-y-6">
                <div className="p-4 rounded-full bg-primary/10 border border-primary/20 w-fit">
                  <service.icon className="w-8 h-8 text-primary" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-semibold mb-3">{service.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </div>
                
                <ul className="space-y-3">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
