import { Card } from "@/components/ui/card";
import { AlertTriangle, Clock, TrendingUp } from "lucide-react";

const problems = [
  {
    icon: AlertTriangle,
    title: "One-Off Posts Get Lost",
    description: "Single videos disappear in the feed. Episodic content keeps people coming back to see what happens next.",
    stat: "86% prefer series over one-offs"
  },
  {
    icon: Clock,
    title: "Your Story Deserves More",
    description: "Your brand journey has depth. Episodic storytelling lets you share the real behind-the-scenes moments.",
    stat: "Series-style content builds loyalty"
  },
  {
    icon: TrendingUp,
    title: "People Connect to Journeys",
    description: "Audiences want to follow along, not just watch an ad. They want to be part of your story arc.",
    stat: "Reality content gets 4x engagement"
  }
];

const ProblemSection = () => {
  return (
    <section id="process" className="py-12 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 px-2">
            Why Episodic Marketing Works
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Your brand has a story worth following. Let's turn it into episodes people actually want to watch.
          </p>
        </div>
        
        {/* Problem Cards */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {problems.map((problem, index) => (
            <Card 
              key={index} 
              className="p-6 card-cinematic bg-gradient-card border-border/50 hover:border-primary/30"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-4 rounded-full bg-destructive/10 border border-destructive/20">
                  <problem.icon className="w-8 h-8 text-destructive" />
                </div>
                
                <h3 className="text-2xl font-semibold">{problem.title}</h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {problem.description}
                </p>
                
                <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                  <p className="text-sm font-medium text-accent">{problem.stat}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold mb-3">Think Series, Not Posts</h3>
            <p className="text-lg font-medium text-primary">
              Build a narrative people want to follow.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;