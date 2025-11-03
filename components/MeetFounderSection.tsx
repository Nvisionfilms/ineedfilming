import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Mic, Target } from "lucide-react";
import ericImage from "@/assets/eric-sattler.png";

const MeetFounderSection = () => {
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Meet Eric Sattler
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              A filmmaker-turned-marketer who discovered that the most powerful marketing asset isn't a logo or a tagline—it's the founder's story.
            </p>
            <p className="text-lg mb-6">
              Since founding NVision Films in 2019, Eric has helped dozens of founders transform their personal journeys into strategic content that builds trust, shortens sales cycles, and creates genuine connection.
            </p>
            <p className="text-lg mb-8">
              "We create brand films for <strong>builders, not influencers</strong>. Your story isn't just content—it's your competitive advantage."
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <Video className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Filmmaker Background</h4>
                  <p className="text-muted-foreground">Professional production expertise meets marketing strategy</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mic className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">The Reel World Podcast</h4>
                  <p className="text-muted-foreground">Host of conversations about authentic storytelling in business</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Target className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-1">Strategy-First Approach</h4>
                  <p className="text-muted-foreground">"We don't press record until the vision is clear"</p>
                </div>
              </div>
            </div>

            <Button 
              variant="cta" 
              size="lg"
              onClick={() => document.getElementById('lead-capture')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Work With Eric
            </Button>
          </div>

          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-lg">
              <img 
                src={ericImage} 
                alt="Eric Sattler - Founder of NVision Films"
                className="w-full h-auto object-cover rounded-lg"
              />
            </div>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-4">Not Content. Connection.</h3>
                <p className="text-muted-foreground">
                  In a world drowning in content, we create films that build real relationships between founders and their ideal clients. Every frame serves your business strategy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Who We Serve</h3>
                <p className="text-muted-foreground mb-4">
                  We work with <strong>builders, not influencers</strong>—founders who are transforming industries, solving real problems, and building businesses that matter.
                </p>
                <p className="text-muted-foreground">
                  Corporate leaders, nonprofits making impact, event creators, and independent artists who understand that their story is their strategy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MeetFounderSection;
