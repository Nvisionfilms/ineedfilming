import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Phone, Calendar as CalendarIcon, DollarSign, User, Mail, Building, FileText, Loader2, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { calculateDeposit, getDepositPercentage } from "@/constants/packages";

export default function AdminManualBooking() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingCreated, setBookingCreated] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [paymentLinkGenerated, setPaymentLinkGenerated] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");

  const [formData, setFormData] = useState({
    // Client Info
    client_name: "",
    client_email: "",
    client_phone: "",
    client_company: "",
    client_type: "small_business" as "small_business" | "commercial",
    
    // Project Info
    project_details: "",
    requested_price: "",
    
    // Booking Info
    booking_date: undefined as Date | undefined,
    booking_time: "10:00 AM",
    
    // Admin Notes
    admin_notes: "",
    
    // Auto-approve
    auto_approve: true,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const timeSlots = [
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
    "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM"
  ];

  const handleSubmit = async () => {
    // Validation
    if (!formData.client_name || !formData.client_email || !formData.client_phone) {
      toast({
        title: "Missing Information",
        description: "Please fill in client name, email, and phone",
        variant: "destructive",
      });
      return;
    }

    if (!formData.requested_price || parseFloat(formData.requested_price) <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid project price",
        variant: "destructive",
      });
      return;
    }

    if (!formData.booking_date) {
      toast({
        title: "Missing Date",
        description: "Please select a booking date",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const price = parseFloat(formData.requested_price);
      const deposit = calculateDeposit(price);

      // Create booking request
      const bookingData: any = {
        client_name: formData.client_name,
        client_email: formData.client_email,
        client_phone: formData.client_phone,
        client_company: formData.client_company || null,
        client_type: formData.client_type,
        requested_price: price,
        deposit_amount: deposit,
        project_details: formData.project_details || null,
        booking_date: format(formData.booking_date, 'yyyy-MM-dd'),
        booking_time: formData.booking_time,
        admin_notes: formData.admin_notes || null,
        status: formData.auto_approve ? "approved" : "pending",
      };

      // If auto-approve, set approved price
      if (formData.auto_approve) {
        bookingData.approved_price = price;
        bookingData.approved_at = new Date().toISOString();
      }

      const { data: booking, error: bookingError } = await supabase
        .from("custom_booking_requests")
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) throw bookingError;

      setCreatedBookingId(booking.id);
      setBookingCreated(true);

      toast({
        title: "Booking Created!",
        description: `Booking for ${formData.client_name} has been created successfully`,
      });

      // If auto-approved, also create opportunity in pipeline
      if (formData.auto_approve) {
        await supabase.from("opportunities").insert({
          booking_id: booking.id,
          contact_name: formData.client_name,
          contact_email: formData.client_email,
          contact_phone: formData.client_phone,
          company: formData.client_company || null,
          service_type: formData.project_details?.substring(0, 100) || "Manual Booking",
          budget_min: price,
          budget_max: price,
          notes: formData.admin_notes || `Manual booking created via admin panel`,
          stage: "won",
          source: "phone_call",
          expected_close_date: formData.booking_date ? format(formData.booking_date, 'yyyy-MM-dd') : null,
        });
      }

    } catch (error: any) {
      console.error("Error creating booking:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGeneratePaymentLink = async () => {
    if (!createdBookingId) return;

    setIsProcessing(true);
    try {
      const price = parseFloat(formData.requested_price);
      const deposit = calculateDeposit(price);

      // Get the booking to pass to payment link function
      const { data: booking, error: fetchError } = await supabase
        .from("custom_booking_requests")
        .select("*")
        .eq("id", createdBookingId)
        .single();

      if (fetchError) throw fetchError;

      // Call Edge Function to create payment link
      const { data, error } = await supabase.functions.invoke("create-payment-link", {
        body: {
          bookingId: createdBookingId,
          amount: deposit, // Default to deposit
          description: `Deposit for ${formData.client_name} - ${formData.project_details || 'Video Project'}`,
        },
      });

      if (error) throw error;

      setPaymentLink(data.url);
      setPaymentLinkGenerated(true);

      toast({
        title: "Payment Link Generated!",
        description: `Payment link sent to ${formData.client_email}`,
      });

    } catch (error: any) {
      console.error("Error generating payment link:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate payment link",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFormData({
      client_name: "",
      client_email: "",
      client_phone: "",
      client_company: "",
      client_type: "small_business",
      project_details: "",
      requested_price: "",
      booking_date: undefined,
      booking_time: "10:00 AM",
      admin_notes: "",
      auto_approve: true,
    });
    setBookingCreated(false);
    setCreatedBookingId(null);
    setPaymentLinkGenerated(false);
    setPaymentLink("");
  };

  const depositAmount = formData.requested_price ? calculateDeposit(parseFloat(formData.requested_price)) : 0;
  const depositPercentage = formData.requested_price ? getDepositPercentage(parseFloat(formData.requested_price)) : 50;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Phone className="w-8 h-8" />
          Manual Booking Entry
        </h1>
        <p className="text-muted-foreground">Create bookings from phone calls or in-person meetings</p>
      </div>

      {bookingCreated ? (
        // Success State
        <Card className="border-green-500 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              Booking Created Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg space-y-2">
              <p className="font-semibold">Booking Details:</p>
              <p className="text-sm">Client: {formData.client_name}</p>
              <p className="text-sm">Email: {formData.client_email}</p>
              <p className="text-sm">Price: ${parseFloat(formData.requested_price).toLocaleString()}</p>
              <p className="text-sm">Deposit Required: ${depositAmount.toLocaleString()} ({depositPercentage}%)</p>
              <p className="text-sm">Status: {formData.auto_approve ? "Approved" : "Pending Review"}</p>
            </div>

            {!paymentLinkGenerated ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Next step: Generate a payment link to send to the client
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleGeneratePaymentLink}
                    disabled={isProcessing}
                    size="lg"
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Generate Payment Link
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/admin/bookings")}
                  >
                    View in Bookings
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-2">
                  <p className="font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Payment Link Generated & Emailed!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Payment link has been sent to {formData.client_email}
                  </p>
                  {paymentLink && (
                    <div className="mt-2">
                      <Label className="text-xs">Payment Link:</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={paymentLink}
                          readOnly
                          className="text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(paymentLink);
                            toast({ title: "Copied to clipboard!" });
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleReset} variant="outline" className="flex-1">
                    Create Another Booking
                  </Button>
                  <Button onClick={() => navigate("/admin/bookings")} className="flex-1">
                    View All Bookings
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Form State
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="grid gap-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_name">Full Name *</Label>
                    <Input
                      id="client_name"
                      value={formData.client_name}
                      onChange={(e) => handleInputChange("client_name", e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_email">Email *</Label>
                    <Input
                      id="client_email"
                      type="email"
                      value={formData.client_email}
                      onChange={(e) => handleInputChange("client_email", e.target.value)}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_phone">Phone *</Label>
                    <Input
                      id="client_phone"
                      type="tel"
                      value={formData.client_phone}
                      onChange={(e) => handleInputChange("client_phone", e.target.value)}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_company">Company Name</Label>
                    <Input
                      id="client_company"
                      value={formData.client_company}
                      onChange={(e) => handleInputChange("client_company", e.target.value)}
                      placeholder="Company Inc."
                    />
                  </div>
                </div>

                <div>
                  <Label>Client Type</Label>
                  <RadioGroup
                    value={formData.client_type}
                    onValueChange={(value: "small_business" | "commercial") =>
                      handleInputChange("client_type", value)
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
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="requested_price">Project Price *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="requested_price"
                      type="number"
                      step="0.01"
                      value={formData.requested_price}
                      onChange={(e) => handleInputChange("requested_price", e.target.value)}
                      placeholder="5000.00"
                      className="pl-9"
                      required
                    />
                  </div>
                  {formData.requested_price && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Deposit Required: ${depositAmount.toLocaleString()} ({depositPercentage}%)
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="project_details">Project Description</Label>
                  <Textarea
                    id="project_details"
                    value={formData.project_details}
                    onChange={(e) => handleInputChange("project_details", e.target.value)}
                    placeholder="Describe the project scope, deliverables, and any special requirements..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Booking Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Booking Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Booking Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal mt-2",
                            !formData.booking_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.booking_date ? format(formData.booking_date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.booking_date}
                          onSelect={(date) => handleInputChange("booking_date", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="booking_time">Booking Time</Label>
                    <Select
                      value={formData.booking_time}
                      onValueChange={(value) => handleInputChange("booking_time", value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Notes (Internal)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="admin_notes">Notes</Label>
                  <Textarea
                    id="admin_notes"
                    value={formData.admin_notes}
                    onChange={(e) => handleInputChange("admin_notes", e.target.value)}
                    placeholder="Internal notes about this booking (not visible to client)..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto_approve"
                    checked={formData.auto_approve}
                    onChange={(e) => handleInputChange("auto_approve", e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="auto_approve" className="cursor-pointer font-normal">
                    Auto-approve this booking (recommended for phone bookings)
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/bookings")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isProcessing}
                className="flex-1"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Create Booking
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
