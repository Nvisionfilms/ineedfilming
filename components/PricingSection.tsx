import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { packages } from "@/constants/packages";

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Pick Your <span className="text-primary">Season</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the episodic package that fits your brand's story arc.
          </p>

          <div className="flex flex-wrap gap-4 justify-center items-center text-sm">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>Flexible Payment Plans</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>Full Production Included</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>Strategy First Approach</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {packages.map((pkg, index) => (
            <Card 
              key={index} 
              className={pkg.badge ? "border-primary shadow-lg relative" : ""}
            >
              {pkg.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  {pkg.badge}
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl mb-2">{pkg.name}</CardTitle>
                <p className="text-muted-foreground mb-4">{pkg.tagline}</p>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">
                      ${pkg.price.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{pkg.paymentPlan}</p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant={pkg.badge ? "cta" : "outline"}
                  className="w-full"
                  onClick={() => navigate('/booking-portal')}
                >
                  {pkg.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Not Sure Which Season Fits?</h3>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Every brand has a unique story. Let's explore which episodic structure aligns with your vision.
            </p>
            <Button 
              variant="cta" 
              size="lg"
              onClick={() => document.getElementById('lead-capture')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore Your Vision
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default PricingSection;
