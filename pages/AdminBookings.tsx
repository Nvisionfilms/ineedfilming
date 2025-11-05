import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, DollarSign, Clock, User, Mail, Phone, Building, Search, Filter, CreditCard, Archive, ChevronDown, ChevronUp, Trash2, ExternalLink, Folder, FileText, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SensitiveDataMask } from "@/components/SensitiveDataMask";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaymentLinkDialog } from "@/components/PaymentLinkDialog";

const AdminBookings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [counterPrice, setCounterPrice] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientTypeFilter, setClientTypeFilter] = useState("all");
  const [payments, setPayments] = useState<any[]>([]);
  const [expandedBookings, setExpandedBookings] = useState<Record<string, boolean>>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [clientAccounts, setClientAccounts] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const [selectedBookingForMeeting, setSelectedBookingForMeeting] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBookingForDelete, setSelectedBookingForDelete] = useState<any>(null);
  const [meetingData, setMeetingData] = useState({
    title: "",
    date: undefined as Date | undefined,
    time: "09:00",
    durationMinutes: 30,
    description: "",
    meetingLink: "",
  });

  useEffect(() => {
    loadBookings();
    loadProjects();
    loadClientAccounts();
    loadMeetings();
  }, []);

  // Real-time subscription for meetings
  useEffect(() => {
    const channel = supabase
      .channel('meetings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meetings'
        },
        () => {
          console.log('Meeting change detected, reloading...');
          loadMeetings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  const loadBookings = async () => {
    // Only load non-archived, non-deleted bookings for the main view
    const { data, error } = await supabase
      .from("custom_booking_requests")
      .select("*")
      .is("archived_at", null)
      .neq("deleted_permanently", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading bookings",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setBookings(data || []);
      loadPayments();
    }
  };

  const loadPayments = async () => {
    const { data, error } = await supabase
      .from("payments" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPayments(data);
    }
  };

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase.from("projects").select("*");
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error loading projects:", error);
      setProjects([]);
    }
  };

  const loadClientAccounts = async () => {
    try {
      const { data, error } = await supabase.from("client_accounts").select("*");
      if (error) throw error;
      setClientAccounts(data || []);
    } catch (error) {
      console.error("Error loading client accounts:", error);
      setClientAccounts([]);
    }
  };

  const loadMeetings = async () => {
    try {
      const { data, error } = await supabase.from("meetings").select("*");
      if (error) throw error;
      // Filter out meetings with invalid dates
      const validMeetings = (data || []).filter(m => {
        if (!m.scheduled_at) return false;
        const date = new Date(m.scheduled_at);
        return !isNaN(date.getTime());
      });
      setMeetings(validMeetings);
    } catch (error) {
      console.error("Error loading meetings:", error);
      setMeetings([]);
    }
  };

  const getMeetingsForBooking = (bookingId: string) => {
    return meetings.filter((m) => m.booking_id === bookingId);
  };

  const getProjectForBooking = (bookingId: string) => {
    return projects.find((p) => p.booking_id === bookingId);
  };

  const getClientAccountForBooking = (bookingId: string) => {
    return clientAccounts.find((c) => c.booking_id === bookingId);
  };

  const getBookingPayments = (bookingId: string) => {
    return payments.filter((p) => p.booking_id === bookingId);
  };

  const getTotalPaid = (bookingId: string) => {
    return getBookingPayments(bookingId)
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  };

  const getPaymentStatus = (bookingId: string) => {
    const bookingPayments = getBookingPayments(bookingId);
    if (bookingPayments.length === 0) return null;
    
    const hasPaid = bookingPayments.some((p) => p.status === "paid");
    const hasPending = bookingPayments.some((p) => p.status === "pending");
    
    if (hasPaid) return "paid";
    if (hasPending) return "pending";
    return "failed";
  };

  const handleAction = async (action: "approve" | "counter" | "reject") => {
    if (!selectedBooking) return;

    if (action === "counter" && !counterPrice) {
      toast({
        title: "Please enter a counter price",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Call Edge Function to handle booking action and send email
      const { data, error } = await supabase.functions.invoke('approve-custom-booking', {
        body: {
          bookingId: selectedBooking.id,
          action: action,
          counterPrice: action === "counter" ? parseFloat(counterPrice) : null,
          adminNotes: adminNotes
        }
      });

      if (error) throw error;

      // Update opportunity stage in pipeline to match booking status
      const opportunityStage = 
        action === "approve" ? "won" :
        action === "reject" ? "lost" :
        "negotiation"; // counter

      await supabase
        .from("opportunities")
        .update({ stage: opportunityStage })
        .eq("booking_id", selectedBooking.id);

      toast({
        title: "Success!",
        description: `Booking ${action === "approve" ? "approved" : action === "counter" ? "counter-offer sent" : "rejected"} and email sent to client`,
      });

      setSelectedBooking(null);
      setCounterPrice("");
      setAdminNotes("");
      loadBookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsLead = async (bookingId: string) => {
    setIsProcessing(true);
    try {
      // Get the booking details
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) throw new Error("Booking not found");

      // Check if opportunity already exists for this booking
      const { data: existingOpp } = await supabase
        .from("opportunities")
        .select("id")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (existingOpp) {
        toast({
          title: "Already a Lead",
          description: "This booking is already in the pipeline",
          variant: "destructive",
        });
        return;
      }

      // Create opportunity in pipeline (don't change booking status)
      const { error: oppError } = await supabase
        .from("opportunities")
        .insert({
          booking_id: bookingId,
          contact_name: booking.client_name,
          contact_email: booking.client_email,
          contact_phone: booking.client_phone,
          company: booking.client_company,
          service_type: booking.project_details?.substring(0, 100) || "Custom Video Booking",
          budget_min: booking.requested_price,
          budget_max: booking.requested_price,
          notes: `Marked as lead from booking request. ${booking.project_details || ""}`,
          stage: "new_lead",
          source: "booking_portal",
          expected_close_date: booking.booking_date
        });

      if (oppError) throw oppError;

      toast({
        title: "Marked as Lead",
        description: "Booking has been added to pipeline as a new lead",
      });
      
      loadBookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async (bookingId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("custom_booking_requests")
      .update({
        archived_at: new Date().toISOString(),
        archived_by: user?.id
      })
      .eq("id", bookingId);
      
    if (error) {
      toast({
        title: "Error archiving booking",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Booking archived",
        description: "The booking has been moved to Archived",
      });
      loadBookings();
    }
  };

  const handleDelete = async () => {
    if (!selectedBookingForDelete) return;
    
    setIsProcessing(true);
    try {
      // First, remove the booking reference from any projects
      const { error: projectError } = await supabase
        .from("projects")
        .update({ booking_id: null })
        .eq("booking_id", selectedBookingForDelete.id);
      
      if (projectError) throw projectError;

      // Mark as permanently deleted (soft delete)
      const { error } = await supabase
        .from("custom_booking_requests")
        .update({ deleted_permanently: true })
        .eq("id", selectedBookingForDelete.id);
        
      if (error) throw error;

      toast({
        title: "Booking deleted",
        description: "The booking has been permanently removed from the system",
      });
      
      // Close dialog and reload
      setIsDeleteDialogOpen(false);
      setSelectedBookingForDelete(null);
      await loadBookings();
    } catch (error: any) {
      toast({
        title: "Error deleting booking",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScheduleMeeting = async () => {
    if (!selectedBookingForMeeting || !meetingData.title || !meetingData.date || !meetingData.time) {
      toast({
        title: "Missing information",
        description: "Please fill in title, date, and time",
        variant: "destructive",
      });
      return;
    }

    try {
      // Parse 12-hour time format (e.g., "2:00 PM")
      const match = meetingData.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) {
        toast({
          title: "Invalid time format",
          description: "Please use format like '9:00 AM' or '2:30 PM'",
          variant: "destructive",
        });
        return;
      }
      
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const period = match[3].toUpperCase();
      
      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      const scheduledDateTime = new Date(meetingData.date);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      // Direct database insert for meeting
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('meetings')
        .insert({
          booking_id: selectedBookingForMeeting.id,
          project_id: null,
          client_id: null, // Will be linked when client account is created
          title: meetingData.title,
          description: meetingData.description || `Meeting for ${selectedBookingForMeeting.client_name} booking`,
          scheduled_at: scheduledDateTime.toISOString(),
          duration_minutes: meetingData.durationMinutes,
          meeting_link: meetingData.meetingLink,
          meeting_type: 'discovery',
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: "Meeting scheduled!",
        description: `Meeting created for ${selectedBookingForMeeting.client_name}`,
      });

      setIsMeetingDialogOpen(false);
      setSelectedBookingForMeeting(null);
      setMeetingData({
        title: "",
        date: undefined,
        time: "09:00",
        durationMinutes: 30,
        description: "",
        meetingLink: "",
      });
      
      loadMeetings();
      loadBookings();
    } catch (error: any) {
      toast({
        title: "Error scheduling meeting",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Filter bookings based on search and filters
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.client_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.client_phone.includes(searchQuery) ||
      (booking.client_company && booking.client_company.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const matchesClientType = clientTypeFilter === "all" || booking.client_type === clientTypeFilter;

    return matchesSearch && matchesStatus && matchesClientType;
  });

  // Calculate CRM statistics
  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    leads: bookings.filter((b) => b.status === "lead").length,
    approved: bookings.filter((b) => b.status === "approved").length,
    countered: bookings.filter((b) => b.status === "countered").length,
    rejected: bookings.filter((b) => b.status === "rejected").length,
    totalRevenue: bookings
      .filter((b) => b.status === "approved")
      .reduce((sum, b) => sum + parseFloat(String(b.approved_price || b.requested_price)), 0),
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Bookings</h1>
        <p className="text-muted-foreground">Manage custom booking requests and client information</p>
      </div>

      {/* CRM Stats */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Requests</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Leads</p>
          <p className="text-2xl font-bold text-blue-600">{stats.leads}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Counter Offers</p>
          <p className="text-2xl font-bold text-orange-600">{stats.countered}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-primary">${stats.totalRevenue.toLocaleString()}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search" className="mb-2 flex items-center">
              <Search className="w-4 h-4 mr-2" />
              Search Clients
            </Label>
            <Input
              id="search"
              placeholder="Name, email, phone, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="statusFilter" className="mb-2 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Status
            </Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="statusFilter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="countered">Countered</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="clientTypeFilter" className="mb-2 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Client Type
            </Label>
            <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
              <SelectTrigger id="clientTypeFilter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="commercial">Commercial/Agency</SelectItem>
                <SelectItem value="small_business">Small Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Bookings List */}
      <div className="grid gap-6">
        {filteredBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              {searchQuery || statusFilter !== "all" || clientTypeFilter !== "all"
                ? "No bookings match your filters."
                : "No custom booking requests yet."}
            </p>
          </Card>
        ) : (
          filteredBookings.map((booking) => {
            const isExpanded = expandedBookings[booking.id] || false;
            
            return (
            <Card key={booking.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold">{booking.client_name}</h3>
                    <Badge
                      variant={
                        booking.status === "approved"
                          ? "default"
                          : booking.status === "pending"
                          ? "secondary"
                          : booking.status === "lead"
                          ? "outline"
                          : booking.status === "countered"
                          ? "outline"
                          : "destructive"
                      }
                      className={booking.status === "lead" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200" : ""}
                    >
                      {booking.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {booking.booking_date} at {booking.booking_time}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    ${parseFloat(String(booking.requested_price)).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Deposit: ${parseFloat(String(booking.deposit_amount)).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Collapsible Client Details */}
              <Collapsible 
                open={isExpanded} 
                onOpenChange={(open) => setExpandedBookings(prev => ({ ...prev, [booking.id]: open }))}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full mb-2">
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Show Details
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SensitiveDataMask 
                    data={booking.client_email} 
                    type="email"
                    recordId={booking.id}
                    tableName="custom_booking_requests"
                  />
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SensitiveDataMask 
                    data={booking.client_phone} 
                    type="phone"
                    recordId={booking.id}
                    tableName="custom_booking_requests"
                  />
                </div>
                {booking.client_company && (
                  <div className="flex items-center text-sm">
                    <Building className="w-4 h-4 mr-2 text-muted-foreground" />
                    {booking.client_company}
                  </div>
                )}
                    <div className="flex items-center text-sm">
                      <User className="w-4 h-4 mr-2 text-muted-foreground" />
                      {booking.client_type === "commercial" ? "Commercial/Agency" : "Small Business"}
                    </div>
                  </div>

                  {booking.project_details && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground font-semibold mb-1">Project Details:</p>
                      <p className="text-sm">{booking.project_details}</p>
                    </div>
                  )}

                  {booking.admin_notes && (
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <p className="text-sm font-semibold mb-1">Admin Notes:</p>
                      <p className="text-sm">{booking.admin_notes}</p>
                    </div>
                  )}

                  {/* Scheduled Meetings */}
                  {getMeetingsForBooking(booking.id).length > 0 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-sm font-semibold mb-2 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Scheduled Meetings
                      </p>
                      <div className="space-y-2">
                        {getMeetingsForBooking(booking.id).map((meeting) => (
                          <div key={meeting.id} className="text-sm flex items-center justify-between">
                            <div>
                              <p className="font-medium">{meeting.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(meeting.scheduled_at), "PPP 'at' p")}
                              </p>
                            </div>
                            {meeting.meeting_link && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(meeting.meeting_link, "_blank")}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Navigation Links */}
                  {booking.status === "approved" && (
                    <div className="pt-4 border-t flex flex-wrap gap-2">
                      {getProjectForBooking(booking.id) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/admin/projects");
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View Project
                        </Button>
                      )}
                      {getClientAccountForBooking(booking.id) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            const clientAccount = getClientAccountForBooking(booking.id);
                            if (clientAccount) {
                              navigate(`/admin/clients/${clientAccount.id}/files`);
                            }
                          }}
                        >
                          <Folder className="w-4 h-4 mr-2" />
                          View Files
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/admin/clients");
                        }}
                      >
                        <User className="w-4 h-4 mr-2" />
                        View Client Portal
                      </Button>
                    </div>
                  )}

                  {/* Payment Section - Inside Collapsible */}
                  {booking.status === "approved" && (
                    <div className="pt-4 border-t space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">Payment Status</span>
                        </div>
                        {getPaymentStatus(booking.id) && (
                          <Badge
                            variant={
                              getPaymentStatus(booking.id) === "paid"
                                ? "default"
                                : getPaymentStatus(booking.id) === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {getPaymentStatus(booking.id)?.toUpperCase()}
                          </Badge>
                        )}
                      </div>

                      {getBookingPayments(booking.id).length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Paid:</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              ${getTotalPaid(booking.id).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Approved Price:</span>
                            <span className="font-semibold">
                              ${parseFloat(String(booking.approved_price || booking.requested_price)).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Outstanding:</span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">
                              ${(parseFloat(String(booking.approved_price || booking.requested_price)) - getTotalPaid(booking.id)).toLocaleString()}
                            </span>
                          </div>

                          {/* Show payment links */}
                          <div className="pt-2 space-y-1">
                            {getBookingPayments(booking.id).map((payment) => (
                              <div key={payment.id} className="flex items-center justify-between text-xs p-2 bg-background rounded">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {payment.payment_type}
                                  </Badge>
                                  <span>${parseFloat(String(payment.amount)).toLocaleString()}</span>
                                </div>
                                {payment.stripe_checkout_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(payment.stripe_checkout_url, "_blank")}
                                    className="h-6 text-xs"
                                  >
                                    View Link
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <PaymentLinkDialog booking={booking} onSuccess={loadPayments} />
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {(booking.status === "pending" || booking.status === "countered") && (
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      setSelectedBookingForMeeting(booking);
                      // Auto-populate with booking's preferred date and time
                      const bookingDate = new Date(booking.booking_date);
                      setMeetingData({
                        title: `Strategy Call - ${booking.client_name}`,
                        date: bookingDate,
                        time: booking.booking_time || "9:00 AM",
                        durationMinutes: 30,
                        meetingLink: "",
                        description: `Discuss ${booking.project_details?.substring(0, 100) || "project requirements"}`,
                      });
                      setIsMeetingDialogOpen(true);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Meeting
                  </Button>
                  <Button
                    onClick={() => handleMarkAsLead(booking.id)}
                    variant="outline"
                    className="w-full"
                    disabled={isProcessing}
                  >
                    Mark as Lead
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setCounterPrice(String(booking.requested_price));
                        }}
                        className="w-full"
                      >
                        Review & Respond
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Review Booking Request</DialogTitle>
                      <DialogDescription>
                        Review and respond to this custom booking request
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="counterPrice">Counter Price (Optional)</Label>
                        <Input
                          id="counterPrice"
                          type="number"
                          value={counterPrice}
                          onChange={(e) => setCounterPrice(e.target.value)}
                          placeholder="Enter counter-offer price"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Leave as is to approve requested price, or change to make a counter-offer
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="adminNotes">Notes to Client</Label>
                        <Textarea
                          id="adminNotes"
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add any notes or details for the client..."
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleAction("approve")}
                          disabled={isProcessing}
                          className="flex-1"
                          variant="default"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleAction("counter")}
                          disabled={isProcessing || !counterPrice || counterPrice === String(booking.requested_price)}
                          className="flex-1"
                          variant="outline"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Counter Offer
                        </Button>
                        <Button
                          onClick={() => handleAction("reject")}
                          disabled={isProcessing}
                          className="flex-1"
                          variant="destructive"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                </div>
              )}

              {booking.status === "lead" && (
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      setSelectedBookingForMeeting(booking);
                      // Auto-populate with booking's preferred date and time
                      const bookingDate = new Date(booking.booking_date);
                      setMeetingData({
                        title: `Strategy Call - ${booking.client_name}`,
                        date: bookingDate,
                        time: booking.booking_time || "9:00 AM",
                        durationMinutes: 30,
                        meetingLink: "",
                        description: `Discuss ${booking.project_details?.substring(0, 100) || "project requirements"}`,
                      });
                      setIsMeetingDialogOpen(true);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Meeting
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setCounterPrice(String(booking.requested_price));
                        }}
                        className="w-full"
                      >
                        Convert to Client
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Convert Lead to Client</DialogTitle>
                        <DialogDescription>
                          Approve this lead and create their client account
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="counterPrice">Counter Price (Optional)</Label>
                          <Input
                            id="counterPrice"
                            type="number"
                            value={counterPrice}
                            onChange={(e) => setCounterPrice(e.target.value)}
                            placeholder="Enter counter-offer price"
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Leave as is to approve requested price, or change to make a counter-offer
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="adminNotes">Notes to Client</Label>
                          <Textarea
                            id="adminNotes"
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Add any notes or details for the client..."
                            rows={4}
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleAction("approve")}
                            disabled={isProcessing}
                            className="flex-1"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {isProcessing ? "Processing..." : "Approve & Create Client"}
                          </Button>
                          <Button
                            onClick={() => handleAction("counter")}
                            disabled={isProcessing || !counterPrice || counterPrice === String(booking.requested_price)}
                            variant="secondary"
                            className="flex-1"
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            {isProcessing ? "Processing..." : "Send Counter-Offer"}
                          </Button>
                          <Button
                            onClick={() => handleAction("reject")}
                            disabled={isProcessing}
                            variant="destructive"
                            className="flex-1"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            {isProcessing ? "Processing..." : "Reject"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {/* Archive & Delete Buttons */}
              <div className="mt-4 flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex-1">
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Archive this booking?</DialogTitle>
                      <DialogDescription>
                        This will move the booking to the Archived tab. Use this for projects that went ghost but might come back.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 justify-end mt-4">
                      <Button variant="outline" onClick={() => {}}>Cancel</Button>
                      <Button onClick={() => handleArchive(booking.id)}>Archive Booking</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isDeleteDialogOpen && selectedBookingForDelete?.id === booking.id} onOpenChange={(open) => {
                  if (open) {
                    setSelectedBookingForDelete(booking);
                    setIsDeleteDialogOpen(true);
                  } else {
                    setIsDeleteDialogOpen(false);
                    setSelectedBookingForDelete(null);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex-1 text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Permanently delete this booking?</DialogTitle>
                      <DialogDescription>
                        This will permanently remove the booking from your system. Use this for people who don't follow up and you don't want affecting your graphs and numbers. This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 justify-end mt-4">
                      <Button variant="outline" onClick={() => {
                        setIsDeleteDialogOpen(false);
                        setSelectedBookingForDelete(null);
                      }}>Cancel</Button>
                      <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        {isProcessing ? "Deleting..." : "Delete Permanently"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          );
          })
        )}
      </div>

      {/* Schedule Meeting Dialog */}
      <Dialog open={isMeetingDialogOpen} onOpenChange={setIsMeetingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>
              Schedule a call with {selectedBookingForMeeting?.client_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="meeting-title">Meeting Title *</Label>
              <Input
                id="meeting-title"
                value={meetingData.title}
                onChange={(e) => setMeetingData({ ...meetingData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="meeting-date">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !meetingData.date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {meetingData.date ? format(meetingData.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={meetingData.date}
                    onSelect={(date) => setMeetingData({ ...meetingData, date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="meeting-time">Time *</Label>
              <Input
                id="meeting-time"
                type="text"
                placeholder="e.g. 2:00 PM"
                value={meetingData.time}
                onChange={(e) => setMeetingData({ ...meetingData, time: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Use 12-hour format (e.g. 9:00 AM, 2:30 PM)</p>
            </div>
            <div>
              <Label htmlFor="meeting-duration">Duration (minutes)</Label>
              <select
                id="meeting-duration"
                value={meetingData.durationMinutes}
                onChange={(e) => setMeetingData({ ...meetingData, durationMinutes: parseInt(e.target.value) })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
              </select>
            </div>
            <div>
              <Label htmlFor="meeting-link">Meeting Link (Optional)</Label>
              <Input
                id="meeting-link"
                type="url"
                placeholder="https://meet.google.com/... (add later if needed)"
                value={meetingData.meetingLink}
                onChange={(e) => setMeetingData({ ...meetingData, meetingLink: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">You can add the meeting link later once date/time is confirmed</p>
            </div>
            <div>
              <Label htmlFor="meeting-description">Description</Label>
              <Textarea
                id="meeting-description"
                value={meetingData.description}
                onChange={(e) => setMeetingData({ ...meetingData, description: e.target.value })}
                rows={3}
              />
            </div>
            <Button onClick={handleScheduleMeeting} className="w-full">
              Schedule Meeting
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBookings;
