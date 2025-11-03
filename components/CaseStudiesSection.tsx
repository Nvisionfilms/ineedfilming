import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, Users, DollarSign, Target, Zap, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const caseStudies = [
  {
    title: "Blazer Tag",
    subtitle: "From Menu Boards to Sales Machine",
    client: "Joe Michael Ramirez",
    role: "General Manager / Owner",
    location: "Austin, TX",
    problem: "Outdated, cluttered menus were hurting food sales.",
    solution: "48-hour cinematic menu overhaul.",
    bigWin: "+100% Sales Lift",
    winIcon: TrendingUp,
    results: [
      "Doubled sales of top-selling item",
      "Modern, professional in-store presentation",
      "Guests made decisions faster",
      "Boosted staff pride in the product"
    ],
    takeaway: "Strategic visuals aren't decoration—they're revenue tools."
  },
  {
    title: "Triad Films",
    subtitle: "From Local Saturation to Global Scale",
    client: "Karen Dela Torre",
    role: "Founder, Triad Films International",
    location: "Taytay, Rizal, Philippines",
    problem: "Stuck in an oversaturated market with no clear brand edge.",
    solution: "Repositioned for global appeal + premium pricing.",
    bigWin: "20 New Clients",
    winIcon: Users,
    results: [
      "International clients acquired overnight",
      "90%+ client retention rate",
      "Expanded into real estate, commercial, and corporate video",
      "Built and trained a team for scale"
    ],
    takeaway: "Positioning isn't about more posts—it's about the right presence that attracts the right market."
  },
  {
    title: "Philip Israel",
    subtitle: "A Filmmaker's Road to Purpose",
    client: "Philip Israel",
    role: "Video Editor & Aspiring Wildlife Filmmaker",
    location: "Lagos, Nigeria",
    problem: "No roadmap. No replies. No support—just ambition and grit.",
    solution: "Direct mentorship, pricing strategy, and discipline to turn skill into income.",
    bigWin: "First Million Naira",
    winIcon: DollarSign,
    results: [
      "Landed YouTube editing clients",
      "Improved problem-solving in client work",
      "Funded growth with self-earned income",
      "Shifted from doubt to a clear, purpose-driven path"
    ],
    takeaway: "Growth doesn't come from theory—it comes from consistent practice, guided strategy, and purpose bigger than money."
  },
  {
    title: "Operation 1009",
    subtitle: "From Chaos to Clarity",
    client: "Joel Hayes Smith",
    role: "Artist, Activist, Founder of Operation 1009",
    location: "Central Texas (Seguin / New Braunfels)",
    problem: "Powerful message, but no structure. The original video hit hard—but lacked direction, reach, and audience focus.",
    solution: "Reframe from confrontation to connection, craft a clear narrative, and deliver it with cinematic precision.",
    bigWin: "#1 Amazon R&B",
    winIcon: Target,
    results: [
      "#1 Amazon Best New R&B",
      "#14 iTunes R&B, #29 Canada Top Daily Songs",
      "Performances in Washington DC & Kansas City",
      "Press coverage + expanded #1009 community engagement"
    ],
    takeaway: "Clarity and craft turn passion into power—proof that a message can go from shouting into the void to igniting a movement."
  }
];

const CaseStudiesSection = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [Autoplay({ delay: 6000, stopOnInteraction: true })]
  );
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <Badge variant="outline" className="mb-4">
            <Zap className="w-3 h-3 mr-1" />
            Proven Results
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Real Founders. Real Numbers.
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From doubled sales to global expansion—see how strategic storytelling transforms businesses
          </p>
        </div>

        {/* Case Studies Carousel */}
        <div className="relative mb-12">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {caseStudies.map((study, index) => (
                <div key={index} className="flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] pl-6 first:pl-0">
                  <Card className="p-6 hover:shadow-xl transition-all duration-300 border-primary/10 hover:border-primary/30 h-full">
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-2xl font-bold">{study.title}</h3>
                    <p className="text-sm text-muted-foreground">{study.subtitle}</p>
                  </div>
                  <study.winIcon className="w-8 h-8 text-primary opacity-20" />
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p className="font-semibold text-foreground">{study.client}</p>
                  <p>{study.role}</p>
                  <p className="text-primary">{study.location}</p>
                </div>
              </div>

              {/* Problem → Solution */}
              <div className="space-y-3 mb-4">
                <div className="p-3 bg-destructive/5 border-l-2 border-destructive rounded-r">
                  <p className="text-xs font-semibold text-destructive mb-1">The Problem</p>
                  <p className="text-sm text-muted-foreground">{study.problem}</p>
                </div>
                <div className="p-3 bg-primary/5 border-l-2 border-primary rounded-r">
                  <p className="text-xs font-semibold text-primary mb-1">The Fix</p>
                  <p className="text-sm text-muted-foreground">{study.solution}</p>
                </div>
              </div>

              {/* Big Win Badge */}
              <div className="mb-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20 text-center">
                <p className="text-xs text-muted-foreground mb-1">The Win</p>
                <p className="text-2xl font-bold text-primary">{study.bigWin}</p>
              </div>

              {/* Results List */}
              <div className="space-y-2 mb-4">
                {study.results.map((result, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{result}</p>
                  </div>
                ))}
              </div>

              {/* Takeaway */}
              <div className="pt-4 border-t">
                <p className="text-xs font-semibold mb-1">Founder Takeaway:</p>
                <p className="text-sm text-muted-foreground italic">{study.takeaway}</p>
              </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
          
          {/* Carousel Navigation */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <Card className="p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 max-w-3xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              Your Story Could Be Next
            </h3>
            <p className="text-muted-foreground mb-6">
              These aren't just videos—they're business transformations. Book your free strategy session and let's map out your founder story.
            </p>
            <Button 
              size="lg" 
              className="group"
              onClick={() => document.getElementById('lead-capture')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Book Your Free Strategy Session
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CaseStudiesSection;
