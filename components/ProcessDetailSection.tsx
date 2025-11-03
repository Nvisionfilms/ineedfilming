import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Video, Rocket, CheckCircle2 } from "lucide-react";

const processSteps = [
  {
    icon: Lightbulb,
    title: "Vision Session",
    subtitle: "Discover the story behind your brand",
    description: "We map out the real moments, challenges, and wins that make your brand worth following—like pre-production for a reality show.",
    details: [
      "Story framework design",
      "Reality-style documentary planning",
      "Episode structure mapping",
      "Distribution strategy",
    ],
  },
  {
    icon: Video,
    title: "Production Day",
    subtitle: "Reality-show style filming meets cinematic lighting",
    description: "We capture your brand in motion—real moments, real people, cinematic quality. Authentic content that doesn't feel staged.",
    details: [
      "Multi-camera documentary setup",
      "Cinematic lighting + motion",
      "Authentic unscripted moments",
      "Behind-the-scenes reels",
    ],
  },
  {
    icon: Rocket,
    title: "Delivery System",
    subtitle: "Weekly or monthly episode rollout",
    description: "Get episodic content ready for social, ads, and your website. Each piece builds on the last—keeping your audience engaged.",
    details: [
      "Multi-platform formats",
      "Weekly content schedule",
      "Paid ad versions",
      "Thumbnail + title strategy",
    ],
  },
];

const ProcessDetailSection = () => {
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Our Proven <span className="text-primary">Process</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Strategy-first storytelling that becomes a powerful marketing asset—not just another video.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {processSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground italic mb-4">{step.subtitle}</p>
                  <div className="space-y-2">
                    {step.details.map((detail, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{detail}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold mb-2">
              Strategy-First Storytelling
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We start with <strong>strategy, not cameras</strong>—creating content that drives real business results.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ProcessDetailSection;
