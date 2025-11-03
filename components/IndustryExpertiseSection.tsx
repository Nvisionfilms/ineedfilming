import { Card, CardContent } from "@/components/ui/card";
import { Building2, Heart, Calendar, Music } from "lucide-react";

const industries = [
  {
    icon: Building2,
    title: "Corporate & B2B",
    description: "Transform complex solutions into compelling founder stories that build trust and shorten sales cycles.",
  },
  {
    icon: Heart,
    title: "Nonprofit & Impact",
    description: "Amplify your mission through authentic storytelling that inspires donors and drives meaningful action.",
  },
  {
    icon: Calendar,
    title: "Events & Experiences",
    description: "Capture the energy and emotion of your events with cinematic storytelling that extends your impact.",
  },
  {
    icon: Music,
    title: "Music & Artists",
    description: "From concept to distribution, we create music videos that connect with audiences and build your brand.",
  },
];

const IndustryExpertiseSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Specialized Expertise Across Industries
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            We understand that every industry has unique storytelling needs. Our experience spans multiple sectors, 
            but our focus remains the same: <strong>your authentic story, strategically told</strong>.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {industries.map((industry, index) => {
            const Icon = industry.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <Icon className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-2xl font-semibold mb-3">{industry.title}</h3>
                  <p className="text-muted-foreground">{industry.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Based in Austin, Texas</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Serving clients nationwide with full-service production capabilities. 
              We bring our expertise to your location, or welcome you to our Austin production facilities.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default IndustryExpertiseSection;
