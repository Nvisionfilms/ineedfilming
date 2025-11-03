import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, Calendar } from "lucide-react";

const BookingSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
    }
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card/20">
      <Navigation />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card className="p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-primary" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold mb-4">Booking Confirmed!</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Thank you for choosing NVision Films
            </p>

            <div className="bg-muted rounded-lg p-6 mb-8 text-left">
              <h3 className="font-bold text-lg mb-4">What Happens Next?</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 mr-3 mt-0.5 text-primary" />
                  <div>
                    <div className="font-semibold">Confirmation Email</div>
                    <div className="text-sm text-muted-foreground">
                      You'll receive a confirmation email with all your booking details and payment receipt.
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 mr-3 mt-0.5 text-primary" />
                  <div>
                    <div className="font-semibold">Pre-Production Call</div>
                    <div className="text-sm text-muted-foreground">
                      Eric will reach out within 24 hours to schedule a pre-production strategy call.
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 mr-3 mt-0.5 text-primary" />
                  <div>
                    <div className="font-semibold">Your Vision Comes to Life</div>
                    <div className="text-sm text-muted-foreground">
                      We'll work together to bring your story to life through powerful video content.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate('/')} variant="default" size="lg">
                Back to Home
              </Button>
              <Button 
                onClick={() => window.open('https://calendly.com/nvisionfilms', '_blank')} 
                variant="outline" 
                size="lg"
              >
                Schedule Strategy Call
              </Button>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingSuccess;
