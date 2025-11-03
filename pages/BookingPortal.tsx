import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalendarIcon, Clock, DollarSign, Package as PackageIcon, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { packages as sharedPackages, customPackage, timeSlots, calculateDeposit, getDepositPercentage } from "@/constants/packages";
import CountdownTimer from "@/components/CountdownTimer";

// Combine shared packages with custom package for BookingPortal
const packages = [...sharedPackages.map(pkg => ({
  id: pkg.id,
  name: pkg.name,
  price: pkg.price,
  originalPrice: pkg.originalPrice,
  deposit: calculateDeposit(pkg.price),
  description: pkg.description,
  features: pkg.features
})), {
  ...customPackage,
  originalPrice: 0, // Custom packages don't have original pricing
  deposit: 0 // Will be calculated dynamically
}];

const BookingPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const approvalToken = searchParams.get("token");
  
  const [step, setStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [paymentType, setPaymentType] = useState<"deposit" | "full">("deposit");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    projectDetails: "",
    clientType: "small_business" as "small_business" | "commercial"
  });
  const [customPrice, setCustomPrice] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvedBooking, setApprovedBooking] = useState<any>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Check countdown expiration status
  useEffect(() => {
    const checkExpiration = () => {
      const STORAGE_KEY = "nvision_countdown_v2";
      const stored = localStorage.getItem(STORAGE_KEY);
      const now = new Date();
      
      if (stored) {
        const storedDate = new Date(stored);
        // If it's a new month, reset
        if (storedDate.getMonth() !== now.getMonth() || storedDate.getFullYear() !== now.getFullYear()) {
          localStorage.setItem(STORAGE_KEY, now.toISOString());
          setIsExpired(false);
          return;
        }
        
        // Check if 7 days have passed
        const endDate = new Date(storedDate);
        endDate.setDate(endDate.getDate() + 7);
        endDate.setHours(23, 59, 59, 999);
        setIsExpired(now > endDate);
      } else {
        // First time - start fresh
        localStorage.setItem(STORAGE_KEY, now.toISOString());
        setIsExpired(false);
      }
    };
    
    checkExpiration();
  }, []);

  // Load approved booking if token exists
  useEffect(() => {
    if (approvalToken) {
      loadApprovedBooking();
    }
  }, [approvalToken]);

  const handleExpire = () => {
    setIsExpired(true);
  };

  const loadApprovedBooking = async () => {
    try {
      const { data, error } = await supabase
        .from("custom_booking_requests")
        .select("*")
        .eq("approval_token", approvalToken)
        .eq("status", "approved")
        .single();

      if (error) throw error;

      if (data) {
        setApprovedBooking(data);
        setSelectedPackage("custom");
        setCustomPrice(data.approved_price.toString());
        setSelectedDate(new Date(data.booking_date));
        setSelectedTime(data.booking_time);
        setFormData({
          name: data.client_name,
          email: data.client_email,
          phone: data.client_phone,
          company: data.client_company || "",
          projectDetails: data.project_details || "",
          clientType: (data.client_type as "small_business" | "commercial") || "small_business"
        });
        setStep(4); // Go directly to payment
      }
    } catch (error: any) {
      console.error("Error loading approved booking:", error);
      toast({
        title: "Invalid or expired booking link",
        variant: "destructive"
      });
    }
  };

  const selectedPkg = packages.find(p => p.id === selectedPackage);
  
  // Calculate dynamic price and deposit - use expired pricing if countdown has ended
  const actualPrice = selectedPackage === "custom" && customPrice 
    ? parseFloat(customPrice) 
    : isExpired 
      ? (selectedPkg?.originalPrice || 0)
      : (selectedPkg?.price || 0);
  
  const actualDeposit = selectedPackage === "custom" && customPrice
    ? calculateDeposit(parseFloat(customPrice))
    : (selectedPkg?.deposit || 0);

  const paymentAmount = paymentType === "deposit" ? actualDeposit : actualPrice;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNext = async () => {
    if (step === 1 && !selectedPackage) {
      toast({
        title: "Please select a package",
        variant: "destructive"
      });
      return;
    }

    if (step === 1 && selectedPackage === "custom" && !customPrice) {
      toast({
        title: "Please enter your budget",
        variant: "destructive"
      });
      return;
    }

    if (step === 2 && (!selectedDate || !selectedTime)) {
      toast({
        title: "Please select date and time",
        variant: "destructive"
      });
      return;
    }

    if (step === 3 && (!formData.name || !formData.email || !formData.phone)) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    // Honeypot check - if filled, it's a bot
    if (step === 3 && honeypot) {
      console.log("Bot detected via honeypot");
      return;
    }

    // If custom package and not approved yet, submit for approval
    if (step === 3 && selectedPackage === "custom" && !approvedBooking) {
      await submitCustomBookingRequest();
      return;
    }

    setStep(step + 1);
  };

  const submitCustomBookingRequest = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke("submit-custom-booking", {
        body: {
          clientName: formData.name,
          clientEmail: formData.email,
          clientPhone: formData.phone,
          clientCompany: formData.company,
          clientType: formData.clientType,
          requestedPrice: parseFloat(customPrice),
          depositAmount: calculateDeposit(parseFloat(customPrice)),
          projectDetails: formData.projectDetails,
          bookingDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
          bookingTime: selectedTime,
        }
      });

      if (error) throw error;

      toast({
        title: "Request Submitted!",
        description: "Eric will review your custom booking request and get back to you shortly via email.",
      });

      navigate("/");
    } catch (error: any) {
      console.error("Error submitting custom booking:", error);
      toast({
        title: "Submission Error",
        description: error.message || "Failed to submit request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handlePayment = async () => {
    if (!agreedToTerms) {
      toast({
        title: "Please agree to the terms",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          packageId: selectedPackage,
          packageName: selectedPkg?.name,
          amount: paymentAmount,
          paymentType,
          bookingDetails: {
            date: selectedDate ? format(selectedDate, 'PPP') : '',
            time: selectedTime,
            ...formData,
            customPrice: customPrice || null,
            approvalToken: approvalToken || null
          }
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const depositPercentage = actualPrice >= 5000 ? 30 : 50;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card/20">
      <Navigation />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Countdown Timer Section */}
          {!isExpired && (
            <Card className="p-6 mb-8 bg-destructive/10 border-2 border-destructive/50 shadow-xl shadow-destructive/20 animate-fade-in">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-full text-sm font-bold mb-4 animate-pulse">
                  <Clock className="w-4 h-4" />
                  Limited Time Launch Pricing - Ending Soon
                </div>
                <p className="text-sm font-semibold mb-4 text-destructive">Launch pricing expires in:</p>
                <CountdownTimer onExpire={handleExpire} />
                <p className="text-xs text-destructive/80 font-semibold mt-4">Lock in up to 42% off regular pricing</p>
              </div>
            </Card>
          )}

          {isExpired && (
            <Card className="p-6 mb-8 bg-muted/50 border-muted">
              <div className="text-center">
                <p className="text-sm font-semibold text-muted-foreground">
                  Launch pricing has ended - Regular pricing now applies
                </p>
              </div>
            </Card>
          )}

          {/* Progress Indicator */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                  </div>
                  {s < 4 && (
                    <div className={`flex-1 h-1 mx-2 transition-all ${
                      step > s ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Select Package</span>
              <span>Schedule</span>
              <span>Your Info</span>
              <span>Payment</span>
            </div>
          </div>

          {/* Step 1: Package Selection */}
          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <Badge variant="secondary" className="mb-4 bg-primary/20 text-primary border-primary/30">
                  FOUNDER REALITY SERIES
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Book Your Free Strategy Call
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  30 minutes with Eric. Zero pressure.
                </p>
              </div>

              {/* Payment Terms Info */}
              <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 mr-3 mt-0.5 text-primary" />
                  <div className="text-sm space-y-2">
                    <p><strong>Payment Terms:</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Deposit reserves your film date</li>
                      <li>Editing begins only after full payment is received</li>
                      <li>Under $5,000: <strong>50% deposit</strong> required</li>
                      <li>$5,000 and above: <strong>30% deposit</strong> required</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {packages.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className={`p-6 cursor-pointer transition-all hover:border-primary ${
                      selectedPackage === pkg.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      setSelectedPackage(pkg.id);
                      if (pkg.id !== "custom") setCustomPrice("");
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                        <p className="text-muted-foreground">{pkg.description}</p>
                      </div>
                      {selectedPackage === pkg.id && (
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    {pkg.id !== "custom" ? (
                      <div className="mb-4">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-3xl font-bold text-primary">
                            ${isExpired ? pkg.originalPrice.toLocaleString() : pkg.price.toLocaleString()}
                          </span>
                          {!isExpired && (
                            <span className="text-lg text-muted-foreground line-through">
                              ${pkg.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ${isExpired ? calculateDeposit(pkg.originalPrice).toLocaleString() : pkg.deposit.toLocaleString()} deposit ({getDepositPercentage(isExpired ? pkg.originalPrice : pkg.price)}%)
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4">
                        {selectedPackage === "custom" ? (
                          <div>
                            <Label htmlFor="customPrice">Your Budget</Label>
                            <Input
                              id="customPrice"
                              type="number"
                              value={customPrice}
                              onChange={(e) => setCustomPrice(e.target.value)}
                              placeholder="Enter your budget"
                              className="mt-2"
                              onClick={(e) => e.stopPropagation()}
                            />
                            {customPrice && (
                              <div className="text-sm text-muted-foreground mt-2">
                                Deposit: ${calculateDeposit(parseFloat(customPrice)).toLocaleString()} 
                                ({getDepositPercentage(parseFloat(customPrice))}%)
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-lg text-muted-foreground">Price based on your needs</div>
                        )}
                      </div>
                    )}
                    <ul className="space-y-2">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm">
                          <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={handleNext} size="lg" variant="cta">
                  Continue to Scheduling
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Date & Time Selection */}
          {step === 2 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4">Schedule Your Session</h1>
                <p className="text-xl text-muted-foreground">Pick a date and time that works for you</p>
              </div>
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    Select Date
                  </h3>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </Card>
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Select Time
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        onClick={() => setSelectedTime(time)}
                        className="w-full"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </Card>
              </div>
              <div className="flex justify-between">
                <Button onClick={handleBack} variant="outline" size="lg">
                  Back
                </Button>
                <Button onClick={handleNext} size="lg" variant="cta">
                  Continue to Contact Info
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Contact Information */}
          {step === 3 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4">Your Information</h1>
                <p className="text-xl text-muted-foreground">Tell us about yourself and your project</p>
              </div>
              <Card className="p-8 mb-8">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Client Type Selection */}
                  <div className="md:col-span-2">
                    <Label>Client Type</Label>
                    <RadioGroup 
                      value={formData.clientType} 
                      onValueChange={(value: "small_business" | "commercial") => 
                        setFormData({...formData, clientType: value})
                      }
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="small_business" id="small_business" />
                        <Label htmlFor="small_business" className="cursor-pointer font-normal">
                          Small Business / Independent
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="commercial" id="commercial" />
                        <Label htmlFor="commercial" className="cursor-pointer font-normal">
                          Commercial / Agency
                        </Label>
                      </div>
                    </RadioGroup>
                    {formData.clientType === "commercial" && (
                      <p className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-lg">
                        <AlertCircle className="w-4 h-4 inline mr-2" />
                        Commercial terms apply - Eric will contact you to discuss project scope and payment terms
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="Your Company"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="projectDetails">Project Details</Label>
                    <Textarea
                      id="projectDetails"
                      name="projectDetails"
                      value={formData.projectDetails}
                      onChange={handleInputChange}
                      placeholder="Tell us about your vision and what you want to achieve..."
                      rows={5}
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
                </div>
              </Card>
              <div className="flex justify-between">
                <Button onClick={handleBack} variant="outline" size="lg">
                  Back
                </Button>
                <Button onClick={handleNext} size="lg" variant="cta" disabled={isProcessing}>
                  {selectedPackage === "custom" && !approvedBooking 
                    ? (isProcessing ? "Submitting..." : "Submit for Approval")
                    : "Continue to Payment"
                  }
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4">Complete Your Booking</h1>
                <p className="text-xl text-muted-foreground">Review your selection and proceed to payment</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Booking Summary */}
                <Card className="p-8">
                  <h3 className="text-2xl font-bold mb-6">Booking Summary</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Package</div>
                      <div className="font-semibold">{selectedPkg?.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Date & Time</div>
                      <div className="font-semibold">
                        {selectedDate && format(selectedDate, 'PPP')} at {selectedTime}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Contact</div>
                      <div className="font-semibold">{formData.name}</div>
                      <div className="text-sm">{formData.email}</div>
                      <div className="text-sm">{formData.phone}</div>
                    </div>
                    {formData.company && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Company</div>
                        <div className="font-semibold">{formData.company}</div>
                      </div>
                    )}
                    {selectedPackage === "custom" && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Custom Price</div>
                        <div className="font-semibold">${parseFloat(customPrice).toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Payment Options */}
                <Card className="p-8">
                  <h3 className="text-2xl font-bold mb-6">Payment Options</h3>
                  <RadioGroup value={paymentType} onValueChange={(value: "deposit" | "full") => setPaymentType(value)}>
                    <Card className={`p-4 mb-4 cursor-pointer ${paymentType === 'deposit' ? 'border-primary bg-primary/5' : ''}`}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="deposit" id="deposit" />
                        <Label htmlFor="deposit" className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-bold">Pay Deposit</div>
                              <div className="text-sm text-muted-foreground">Secure your booking ({depositPercentage}%)</div>
                            </div>
                            <div className="text-2xl font-bold text-primary">
                              ${actualDeposit.toLocaleString()}
                            </div>
                          </div>
                        </Label>
                      </div>
                    </Card>
                    <Card className={`p-4 cursor-pointer ${paymentType === 'full' ? 'border-primary bg-primary/5' : ''}`}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="full" id="full" />
                        <Label htmlFor="full" className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-bold">Pay in Full</div>
                              <div className="text-sm text-muted-foreground">Complete payment now</div>
                            </div>
                            <div className="text-2xl font-bold text-primary">
                              ${actualPrice.toLocaleString()}
                            </div>
                          </div>
                        </Label>
                      </div>
                    </Card>
                  </RadioGroup>

                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Total Package Value</span>
                      <span className="text-lg">${actualPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">Amount Due Today</span>
                      <span className="text-2xl font-bold text-primary">
                        ${paymentAmount.toLocaleString()}
                      </span>
                    </div>
                    {paymentType === 'deposit' && (
                      <div className="text-sm text-muted-foreground mt-2">
                        Remaining balance: ${(actualPrice - actualDeposit).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Terms Agreement */}
                  <div className="mt-6 flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm cursor-pointer leading-tight">
                      I agree that the deposit reserves my film date and understand that editing will begin only after full payment is received
                    </Label>
                  </div>

                  <Button
                    onClick={handlePayment}
                    disabled={isProcessing || !agreedToTerms}
                    size="lg"
                    variant="cta"
                    className="w-full mt-6"
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    {isProcessing ? 'Processing...' : `Pay $${paymentAmount.toLocaleString()} with Stripe`}
                  </Button>
                </Card>
              </div>

              <div className="flex justify-start">
                <Button onClick={handleBack} variant="outline" size="lg" disabled={!!approvedBooking}>
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingPortal;