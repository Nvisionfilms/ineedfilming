import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Quote, TrendingUp, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const testimonials = [
  {
    name: "Vicente Cedillos",
    company: "Photography Business",
    role: "Client",
    content: "Working with Eric at NVision Films has been an absolute game-changer for my photography business. He has filmed and produced all of my highlight reels over the past year, recapping my photoshoots with a level of creativity and polish that truly sets him apart.\n\nEric's ingenuity and professionalism are unmatched—he doesn't just show up to capture video, he becomes part of the team. More than once he's stepped in to help with stand-ins, setups, or whatever was needed to ensure the project came together flawlessly.\n\nThe quality of his editing, attention to detail, and ability to bring energy and storytelling into every reel is second to none. I honestly cannot say enough about his work ethic and talent. If you're looking for a videographer/editor who goes above and beyond, Eric is the one you want in your corner.",
    result: "Year-Long Partnership",
    rating: 5
  },
  {
    name: "Casey Jones",
    company: "Video Production Client",
    role: "Client",
    content: "I've been privileged enough to work with Eric Sattler on several occasions. He was very easy to work with, and delivered on each and every project from video editing, directing, and graphic design. Since that time he has continued to add to his impressive resume. Highly recommend.",
    result: "Multiple successful projects",
    rating: 5
  },
  {
    name: "Sean Gilliland",
    company: "Austin Local Guide",
    role: "Podcast Client",
    content: "Best media guy in Austin, TX! You won't find a better director than Eric! He has helped with the branding and podcast we do tremendously! He's a pretty cool guy I guess 😎",
    result: "Branding & Podcast Success",
    rating: 5
  },
  {
    name: "Hunndred Shots Films",
    company: "Fellow Filmmaker",
    role: "Industry Peer",
    content: "Eric gave me great advice regarding pricing my own services. He has great knowledge about the industry as a whole. I would definitely recommend a session with Eric!",
    result: "Expert Industry Guidance",
    rating: 5
  },
  {
    name: "Donald Martin",
    company: "Video Client",
    role: "Client",
    content: "I honestly can't say enough great things about Eric. Super professional. Brings his A-Game every single time. Is super helpful & creative. He's hands down our go to guy when it comes to video. You won't regret starting a relationship with this guy, he's legit as they come!",
    result: "Ongoing Partnership",
    rating: 5
  },
  {
    name: "Bam Benavides",
    company: "Creative Client",
    role: "Client",
    content: "Eric was a very easy person to get along with, listened to al my ideas. Did everything I asked and offered advice from different perspectives I haven't thought of. Which is truly needed at times. The turn around for what I needed was really fast, and he kept me updated along the way.",
    result: "Fast Turnaround",
    rating: 5
  }
];

const stats = [
  { number: "150+", label: "Success Stories", icon: Users },
  { number: "340%", label: "Avg. Growth Rate", icon: TrendingUp },
  { number: "98%", label: "Client Satisfaction", icon: Star },
  { number: "2.5M+", label: "Content Views", icon: Quote }
];

const SocialProofSection = () => {
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  );
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const toggleReview = (index: number) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedReviews(newExpanded);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

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
    <section id="results" className="py-12 bg-gradient-to-b from-background to-card/20">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3 bg-secondary/20 text-secondary border-secondary/30 text-xs sm:text-sm">
            Proven Results
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 px-2">
            Real Founders, Real Results
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            See how founders have transformed their businesses through authentic storytelling.
          </p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <Card key={index} className="p-4 text-center card-cinematic bg-gradient-card border-border/50">
              <div className="flex justify-center mb-2">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary mb-1">{stat.number}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>
        
        {/* Testimonials Carousel */}
        <div className="relative max-w-7xl mx-auto mb-8">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {testimonials.map((testimonial, index) => (
              <div key={index} className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] pl-6 first:pl-0">
                <Card className="p-6 card-cinematic bg-gradient-card border-border/50 hover:border-primary/30 h-full">
              {/* Quote Icon */}
              <Quote className="w-6 h-6 text-primary/30 mb-3" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              
              {/* Content */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground leading-relaxed italic whitespace-pre-line">
                  "{expandedReviews.has(index) || testimonial.content.length <= 150
                    ? testimonial.content
                    : truncateText(testimonial.content, 150)}"
                </p>
                {testimonial.content.length > 150 && (
                  <button
                    onClick={() => toggleReview(index)}
                    className="text-primary hover:text-primary/80 text-sm font-medium mt-2 transition-colors"
                  >
                    {expandedReviews.has(index) ? "Read less" : "Read more"}
                  </button>
                )}
              </div>
              
              {/* Result Badge */}
              <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20 text-xs">
                {testimonial.result}
              </Badge>
              
              {/* Author */}
              <div className="border-t border-border/30 pt-4">
                <div className="font-semibold text-sm">{testimonial.name}</div>
                <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                <div className="text-xs text-primary font-medium">{testimonial.company}</div>
                </div>
              </Card>
            </div>
            ))}
          </div>
        </div>
        
        {/* Carousel Navigation */}
        <div className="flex justify-center gap-4 mb-10">
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
        
        {/* Social Proof Footer */}
        <div className="text-center">
          <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span>Worked with The NFL and Draft Kings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
              <span>2x Videographer of the Year</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              <span>Austin Chronicle Best Of Filmmakers Finalist</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
