import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Play, TrendingUp, Users } from "lucide-react";
import { useState } from "react";

const portfolioItems = [
  {
    title: "Founder Story & Brand Documentary",
    client: "7Gen Legacy Group",
    description: "Multi-day retreat coverage capturing the founder's business journey, client transformation stories, and authentic testimonials that built trust and credibility",
    result: "Elevated brand authority & client trust",
    metric: "2-day production delivered compelling narrative",
    videoId: "7BO-J_rcqTw",
  },
  {
    title: "VIP Event Coverage",
    client: "Blazer Tag Austin ft. IShowSpeed",
    description: "Exclusive high-profile event production capturing brand partnerships and celebrity collaborations that amplified social reach and brand visibility",
    result: "Massive social media impact & brand exposure",
    metric: "Celebrity partnership content that converts",
    videoId: "YMgVtQfbRgQ",
  },
  {
    title: "Full Series Production & Brand Partnership",
    client: "Gamers First Inc. x NFL Films",
    description: "Complete show production partnering with NFL star Micah Parsons and major brands (Evolve PC, GetRekt Labs, Respawn, Govee, Corsair, Scuf). Full creative direction, multi-episode series, and brand integration that drives measurable ROI",
    result: "Multi-brand collaboration showcase",
    metric: "Full-scale production with NFL & Fortune 500 brands",
    videoId: "SdOQ3PJ6hZo",
  },
];

const PortfolioSection = () => {
  const [openVideo, setOpenVideo] = useState<string | null>(null);

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Styles We <span className="text-primary">Film</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From founder stories to full-scale productions—see the variety of filming styles we use to create content that drives real business growth
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {portfolioItems.map((item, index) => (
            <Dialog key={index} open={openVideo === item.videoId} onOpenChange={(open) => setOpenVideo(open ? item.videoId : null)}>
              <DialogTrigger asChild>
                <div className="group cursor-pointer">
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={`https://img.youtube.com/vi/${item.videoId}/maxresdefault.jpg`}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="text-center">
                          <Play className="w-16 h-16 text-white mb-2 mx-auto" />
                          <p className="text-white font-semibold">Watch Full Video</p>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 font-medium">{item.client}</p>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{item.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span>{item.result}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <Users className="w-4 h-4" />
                          <span>{item.metric}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl w-full p-0">
                <div className="aspect-video w-full">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${item.videoId}?autoplay=1`}
                    title={item.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>

        {/* Mockumentary Style Showcase - Hormozi-Style Results */}
        <div className="mt-20">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/30">
              Real Business. Real Numbers.
            </Badge>
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              How SJG Print & Design Hit <span className="text-primary">26% Annual Growth</span> in 6 Months
            </h3>
            <p className="text-xl font-semibold text-primary mb-3">
              10x The Printing Industry Average
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Round Rock, Texas print shop goes from industry average to <span className="font-semibold">rapid-growth territory</span> using our reality-style documentary content approach
            </p>
          </div>

          {/* Results Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
            <Card className="p-6 bg-primary/5 border-primary/20 text-center">
              <div className="text-4xl font-bold text-primary mb-2">26%</div>
              <div className="text-sm font-semibold mb-1">Annual Growth Rate</div>
              <div className="text-xs text-muted-foreground">vs. 2.3% industry avg.</div>
            </Card>
            <Card className="p-6 bg-primary/5 border-primary/20 text-center">
              <div className="text-4xl font-bold text-primary mb-2">10x</div>
              <div className="text-sm font-semibold mb-1">Faster Than Competition</div>
              <div className="text-xs text-muted-foreground">Beating 98% of print shops</div>
            </Card>
            <Card className="p-6 bg-primary/5 border-primary/20 text-center">
              <div className="text-4xl font-bold text-primary mb-2">6mo</div>
              <div className="text-sm font-semibold mb-1">Time to Results</div>
              <div className="text-xs text-muted-foreground">Sustained rapid growth</div>
            </Card>
          </div>

          <Card className="overflow-hidden max-w-5xl mx-auto bg-gradient-to-br from-card to-card/50 border-primary/20">
            <CardContent className="p-0">
              <div className="aspect-video w-full bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/videoseries?list=PLNbfC0P6VBeCxVHVzTkOjAhbXKnmOeRNS&vq=hd720&rel=0"
                  title="SJG Print & Design Reality Series"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
              <div className="p-6 md:p-8 bg-gradient-to-b from-primary/5 to-transparent">
                <h4 className="text-xl font-bold mb-4 text-center">The Mechanism: Reality-Style Content That Converts</h4>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <Play className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="font-semibold mb-1">Authentic Stories</div>
                    <div className="text-sm text-muted-foreground">No fake testimonials. Real moments.</div>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="font-semibold mb-1">Built Trust Fast</div>
                    <div className="text-sm text-muted-foreground">People buy from who they know</div>
                  </div>
                  <div className="text-center">
                    <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="font-semibold mb-1">Increased Awareness</div>
                    <div className="text-sm text-muted-foreground">Local legend status achieved</div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground italic">
                    "Same approach. Different business. Predictable results."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Want to see more examples? Let's discuss your specific vision.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;
