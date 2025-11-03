import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Play, TrendingUp, Users } from "lucide-react";
import { useState } from "react";

const portfolioItems = [
  {
    title: "The Origin Story",
    client: "7Gen Legacy Group",
    description: "Reality-style founder documentary capturing the journey, struggles, and wins. Multi-day coverage that shows the real human behind the business—no scripts, just authentic moments that build trust.",
    result: "Founder becomes relatable authority",
    metric: "2-day reality shoot → compelling narrative",
    videoId: "7BO-J_rcqTw",
  },
  {
    title: "The Big Moment",
    client: "Blazer Tag Austin ft. IShowSpeed",
    description: "High-stakes event coverage filmed like a reality show. Capturing the energy, partnerships, and behind-the-scenes chaos that makes for binge-worthy content and massive social reach.",
    result: "Viral-worthy brand moments captured",
    metric: "Celebrity collab → social explosion",
    videoId: "YMgVtQfbRgQ",
  },
  {
    title: "The Full Season",
    client: "Gamers First Inc. x NFL Films",
    description: "Complete episodic series following a founder's vision from concept to execution. Multi-episode reality production with NFL star Micah Parsons and Fortune 500 brands—filmed like a Netflix docuseries.",
    result: "Multi-brand storytelling showcase",
    metric: "Full-scale reality series with NFL & major brands",
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
            Eric's <span className="text-primary">Approach</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three ways I film founder stories—from single-episode origin stories to full-season reality series that turn your journey into binge-worthy content
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
              Real Founder. Real Numbers. Zero Fluff.
            </Badge>
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              How I Helped SJG Print Hit <span className="text-primary">26% Annual Growth</span> in 6 Months
            </h3>
            <p className="text-xl font-semibold text-primary mb-3">
              10x The Printing Industry Average
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              A Round Rock print shop owner becomes the main character of his own reality series—and his business explodes to <span className="font-semibold">rapid-growth territory</span>
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
                <h4 className="text-xl font-bold mb-4 text-center">The Method: Turn Founders Into Characters People Follow</h4>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <Play className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="font-semibold mb-1">Reality-Style Filming</div>
                    <div className="text-sm text-muted-foreground">No scripts. Just real founder moments.</div>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="font-semibold mb-1">Episodic Storytelling</div>
                    <div className="text-sm text-muted-foreground">People binge what they care about</div>
                  </div>
                  <div className="text-center">
                    <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="font-semibold mb-1">Main Character Energy</div>
                    <div className="text-sm text-muted-foreground">Founder becomes the story</div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground italic">
                    "Same method. Different founder. Predictable results." - Eric Sattler
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Want to see how this works for your founder story? Let's talk.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PortfolioSection;
