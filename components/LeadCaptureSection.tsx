import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckCircle, Clock, Gift, ArrowRight, DollarSign, CalendarIcon } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const benefits = [
  "15-30 minute collaborative session",
  "Explore your brand's story arc",
  "See episodic content examples",
  "Understand timelines & investment",
  "Decide if it's the right fit"
];

const projectTypes = ["Founder Story", "Commercial", "Content Strategy", "Music Video", "Event", "Other"];
const moodLabels = ["Aspirational", "Problem-Solution", "Empathetic", "Authoritative", "Inspirational"];
const genreLabels = ["Pop", "Hip-Hop", "Rock", "Country", "Electronic", "Other"];
const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];

const LeadCaptureSection = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [projectType, setProjectType] = useState("Founder Story");
  const [budget, setBudget] = useState([5000]);
  const [mood, setMood] = useState([50]);
  const [genre, setGenre] = useState([50]);
  const [filmingTime, setFilmingTime] = useState([6]);
  const [preferredDate, setPreferredDate] = useState<Date>();
  const [preferredTime, setPreferredTime] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const getMoodLabel = (value: number) => {
    if (value <= 20) return "Gritty & Raw";
    if (value <= 40) return "Authentic";
    if (value <= 60) return "Balanced";
    if (value <= 80) return "Polished";
    return "Polished & Inspiring";
  };
  
  const getGenreLabel = (value: number) => {
    if (value <= 20) return "Documentary";
    if (value <= 40) return "Docu-Style";
    if (value <= 60) return "Hybrid";
    if (value <= 80) return "Cinematic";
    return "Full Cinematic";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Honeypot check - if filled, it's a bot
    if (honeypot) {
      console.log("Bot detected via honeypot");
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Submit to custom booking function - creates booking, opportunity, and stores contact
      const { error } = await supabase.functions.invoke("submit-custom-booking", {
        body: {
          clientName: name,
          clientEmail: email,
          clientPhone: "N/A", // Not collected in quick form
          clientCompany: null,
          clientType: "small_business", // Default
          requestedPrice: budget[0],
          depositAmount: 0,
          projectDetails: `${projectType} project - ${getMoodLabel(mood[0])} mood, ${getGenreLabel(genre[0])} genre, ${filmingTime[0]} hours filming time`,
          bookingDate: preferredDate ? format(preferredDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          bookingTime: preferredTime || "Not specified",
          honeypot: "",
        },
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your strategy session request has been submitted. Check your email for confirmation!",
      });

      // Reset form
      setName("");
      setEmail("");
      setProjectType("Founder Story");
      setBudget([5000]);
      setMood([50]);
      setGenre([50]);
      setFilmingTime([6]);
      setPreferredDate(undefined);
      setPreferredTime("");
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="lead-capture" className="py-12 md:py-20 bg-gradient-to-b from-card/20 to-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-2 sm:px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <Card className="p-3 sm:p-6 md:p-8 lg:p-12 card-cinematic bg-gradient-card border-border/50 relative overflow-hidden">
            {/* Header */}
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 leading-tight">
                Book Your Free Strategy Call
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                30 minutes with Eric. Zero pressure.
              </p>
            </div>
            
            {/* Form */}
            <div className="max-w-2xl mx-auto">
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <div className="p-2 sm:p-4 md:p-6 rounded-xl bg-muted/20 border border-border/30">
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                    <span className="font-medium text-xs sm:text-sm md:text-base">Project Details</span>
                  </div>
                  
                  <form 
                    onSubmit={handleSubmit} 
                    className="space-y-3 sm:space-y-4 md:space-y-5"
                  >
                    {/* Project Type */}
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium">Project Type</label>
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                        {projectTypes.map((type) => (
                          <Button
                            key={type}
                            type="button"
                            variant={projectType === type ? "default" : "outline"}
                            size="sm"
                            onClick={() => setProjectType(type)}
                            className="text-[10px] sm:text-xs md:text-sm h-8 sm:h-9 md:h-10 px-2 sm:px-3"
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>
                    {/* Budget */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
                          <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                          Budget
                        </label>
                        <span className="text-sm sm:text-base md:text-lg font-bold text-primary">
                          ${budget[0].toLocaleString()}
                        </span>
                      </div>
                      <Slider
                        value={budget}
                        onValueChange={setBudget}
                        min={300}
                        max={15000}
                        step={50}
                        className="py-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>$300</span>
                        <span>$15,000</span>
                      </div>
                    </div>

                    {/* Mood */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm font-medium">Story Vibe</label>
                        <span className="text-xs sm:text-sm font-semibold text-primary">
                          {getMoodLabel(mood[0])}
                        </span>
                      </div>
                      <Slider
                        value={mood}
                        onValueChange={setMood}
                        min={0}
                        max={100}
                        step={1}
                        className="py-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Gritty & Raw</span>
                        <span>Polished & Inspiring</span>
                      </div>
                    </div>

                    {/* Genre */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm font-medium">Content Style</label>
                        <span className="text-xs sm:text-sm font-semibold text-primary">
                          {getGenreLabel(genre[0])}
                        </span>
                      </div>
                      <Slider
                        value={genre}
                        onValueChange={setGenre}
                        min={0}
                        max={100}
                        step={1}
                        className="py-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Documentary</span>
                        <span>Cinematic</span>
                      </div>
                    </div>

                    {/* Filming Time */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm font-medium">Shoot Duration</label>
                        <span className="text-xs sm:text-sm font-semibold text-primary">
                          {filmingTime[0]} hours
                        </span>
                      </div>
                      <Slider
                        value={filmingTime}
                        onValueChange={setFilmingTime}
                        min={2}
                        max={10}
                        step={1}
                        className="py-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>2 hours</span>
                        <span>10 hours</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border/30 pt-3 sm:pt-4">
                      <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">Your Information</h4>
                    </div>

                    {/* Name */}
                    <div>
                      <Input
                        type="text"
                        name="name"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-background/50 border-border/50 focus:border-primary text-sm md:text-base h-10 md:h-11"
                        required
                      />
                    </div>
                    
                    {/* Email */}
                    <div>
                      <Input
                        type="email"
                        name="email"
                        placeholder="Your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-background/50 border-border/50 focus:border-primary text-sm md:text-base h-10 md:h-11"
                        required
                      />
                    </div>

                    {/* Honeypot field - hidden from humans, catches bots */}
                    <div className="absolute opacity-0 pointer-events-none" aria-hidden="true">
                      <Input
                        type="text"
                        name="website"
                        placeholder="Your website"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>

                    {/* Preferred Date */}
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium">Preferred Call Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-background/50 border-border/50 h-10 md:h-11",
                              !preferredDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {preferredDate ? format(preferredDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={preferredDate}
                            onSelect={setPreferredDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Preferred Time */}
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium">Preferred Call Time</label>
                      <div className="grid grid-cols-2 gap-2">
                        {timeSlots.map((time) => (
                          <Button
                            key={time}
                            type="button"
                            variant={preferredTime === time ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPreferredTime(time)}
                            className="text-xs h-9"
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <Button
                      type="submit" 
                      variant="hero" 
                      size="lg" 
                      disabled={isSubmitting}
                      className="w-full text-sm sm:text-base md:text-lg py-3 sm:py-4 md:py-6 h-auto"
                    >
                      <span className="truncate">{isSubmitting ? "Sending..." : "Connect with Eric"}</span>
                      <ArrowRight className="ml-1.5 sm:ml-2 h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                    </Button>
                  </form>
                  
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 md:mt-3 text-center px-1 sm:px-2">
                    No spam. Unsubscribe anytime. We respect your privacy.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Social Proof */}
            <div className="border-t border-border/30 pt-6 md:pt-8 text-center">
              <p className="text-xs md:text-sm text-muted-foreground mb-2 px-1 sm:px-2">
                Join 100+ founders sharing their story:
              </p>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-6 text-xs md:text-sm font-medium text-muted-foreground px-1 sm:px-2">
                <span>Johnny Manziel</span>
                <span className="hidden sm:inline">•</span>
                <span>Micah Parsons</span>
                <span className="hidden sm:inline">•</span>
                <span>Heart Led Money</span>
                <span className="hidden lg:inline">•</span>
                <span className="hidden lg:inline">Buckethead Hats</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default LeadCaptureSection;