import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Mail, Phone, Building, DollarSign, Trash2, Video, Calendar as CalendarIcon, MoreVertical, TrendingUp, AlertCircle, Clock } from "lucide-react";
import { format, formatDistanceToNow, differenceInDays, isBefore } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  calculateLeadScore, 
  getLeadGrade, 
  getLeadGradeColor, 
  getLeadGradeIcon,
  getDaysInStageColor,
  isOpportunityStale,
  calculatePipelineMetrics,
  calculateForecast
} from "@/lib/crm-utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const stages = [
  { id: "new_lead", label: "New Lead", color: "bg-gray-500" },
  { id: "qualified", label: "Qualified", color: "bg-blue-500" },
  { id: "proposal", label: "Proposal Sent", color: "bg-purple-500" },
  { id: "negotiation", label: "Negotiation", color: "bg-orange-500" },
  { id: "won", label: "Won", color: "bg-green-500" },
  { id: "lost", label: "Lost", color: "bg-red-500" },
];

export default function AdminPipeline() {
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [meetingData, setMeetingData] = useState({
    title: "",
    date: undefined as Date | undefined,
    time: "09:00",
    durationMinutes: 30,
    description: "",
    meetingLink: "",
  });
  const [newOpportunity, setNewOpportunity] = useState({
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    company: "",
    service_type: "",
    budget_min: "",
    budget_max: "",
    notes: "",
    stage: "new_lead",
  });
  const [metrics, setMetrics] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [showMetrics, setShowMetrics] = useState(true);

  useEffect(() => {
    loadOpportunities();
  }, []);

  // Real-time subscription for opportunities
  useEffect(() => {
    const channel = supabase
      .channel('opportunities-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'opportunities'
        },
        (payload) => {
          console.log('Opportunity change detected:', payload);
          loadOpportunities();
        }
      )
      .subscribe();

    return () => {
      // Real-time removed - can add WebSocket later
    };
  }, []);

  const loadOpportunities = async () => {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOpportunities(data);
      
      // Calculate metrics
      const pipelineMetrics = calculatePipelineMetrics(data);
      setMetrics(pipelineMetrics);
      
      // Calculate forecast
      const forecastData = calculateForecast(data, 1);
      setForecast(forecastData);
    }
  };

  const handleCreateOpportunity = async () => {
    const { error } = await supabase.from("opportunities").insert([
      {
        ...newOpportunity,
        budget_min: newOpportunity.budget_min ? parseFloat(newOpportunity.budget_min) : null,
        budget_max: newOpportunity.budget_max ? parseFloat(newOpportunity.budget_max) : null,
      },
    ]);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Opportunity created" });
      setIsDialogOpen(false);
      loadOpportunities();
      setNewOpportunity({
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        company: "",
        service_type: "",
        budget_min: "",
        budget_max: "",
        notes: "",
        stage: "new_lead",
      });
    }
  };


  const handleDeleteOpportunity = async (id: string) => {
    const { error } = await supabase
      .from("opportunities")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ 
        title: "Error deleting opportunity", 
        description: error.message, 
        variant: "destructive" 
      });
    } else {
      toast({ title: "Opportunity deleted" });
      loadOpportunities();
    }
  };

  const handleScheduleMeeting = async () => {
    console.log("🔍 Meeting data validation:", {
      hasOpportunity: !!selectedOpportunity,
      title: meetingData.title,
      date: meetingData.date,
      time: meetingData.time,
      link: meetingData.meetingLink
    });

    if (!selectedOpportunity) {
      toast({
        title: "Error",
        description: "No opportunity selected",
        variant: "destructive",
      });
      return;
    }

    if (!meetingData.title) {
      toast({
        title: "Missing Meeting Title",
        description: "Please enter a meeting title",
        variant: "destructive",
      });
      return;
    }

    if (!meetingData.date) {
      toast({
        title: "Missing Date",
        description: "Please select a date for the meeting",
        variant: "destructive",
      });
      return;
    }

    if (!meetingData.time) {
      toast({
        title: "Missing Time",
        description: "Please select a time for the meeting",
        variant: "destructive",
      });
      return;
    }

    if (!meetingData.meetingLink) {
      toast({
        title: "Missing Meeting Link",
        description: "Please paste your Google Meet link",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("✅ All validation passed, creating meeting...");
      console.log("🔗 Linking to opportunity:", selectedOpportunity.id);
      
      // Combine date and time
      const [hours, minutes] = meetingData.time.split(':');
      const scheduledDateTime = new Date(meetingData.date);
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      console.log("📅 Scheduled date/time:", scheduledDateTime.toISOString());
      
      const { data: user, error: authError } = await api.getCurrentUser();
      
      const { error } = await supabase
        .from('meetings')
        .insert({
          project_id: null,
          client_id: null,
          booking_id: null,
          title: meetingData.title,
          description: meetingData.description || `Meeting with ${selectedOpportunity.contact_name} - ${selectedOpportunity.service_type}`,
          scheduled_date: scheduledDateTime.toISOString(),
          duration_minutes: meetingData.durationMinutes,
          meeting_link: meetingData.meetingLink,
          meeting_type: 'discovery',
          created_by: user?.id,
        });

      if (error) {
        console.error("❌ Database error:", error);
        throw error;
      }

      console.log("✅ Meeting created for opportunity");

      toast({
        title: "Meeting scheduled!",
        description: `Meeting created for ${selectedOpportunity.contact_name}`,
      });

      // Update opportunity notes with meeting link
      const { error: updateError } = await supabase
        .from("opportunities")
        .update({
          notes: `${selectedOpportunity.notes || ""}\n\nMeeting scheduled: ${format(scheduledDateTime, 'PPpp')}\nMeet link: ${meetingData.meetingLink}`,
        })
        .eq("id", selectedOpportunity.id);

      if (updateError) {
        console.error("❌ Error updating opportunity notes:", updateError);
      } else {
        console.log("✅ Opportunity notes updated");
      }

      setIsMeetingDialogOpen(false);
      setMeetingData({
        title: "",
        date: undefined,
        time: "09:00",
        durationMinutes: 30,
        description: "",
        meetingLink: "",
      });
      loadOpportunities();
    } catch (error: any) {
      console.error("❌ Error scheduling meeting:", error);
      toast({
        title: "Error scheduling meeting",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const getOpportunitiesByStage = (stageId: string) => {
    return opportunities.filter((opp) => opp.stage === stageId);
  };

  const handleDragStart = (opp: any) => {
    // Store the opportunity being dragged for future drag-and-drop implementation
    console.log('Dragging opportunity:', opp.contact_name);
  };

  const updateStageWithActivity = async (id: string, newStage: string) => {
    // Optimistic update
    setOpportunities(prev => 
      prev.map(opp => opp.id === id ? { ...opp, stage: newStage } : opp)
    );

    const { error } = await supabase
      .from("opportunities")
      .update({ 
        stage: newStage,
        stage_changed_at: new Date().toISOString(),
        days_in_stage: 0
      })
      .eq("id", id);

    if (error) {
      toast({ 
        title: "Error updating stage", 
        description: error.message, 
        variant: "destructive" 
      });
      loadOpportunities();
    } else {
      // Log activity
      await supabase.from("opportunity_activities").insert({
        opportunity_id: id,
        activity_type: 'stage_change',
        description: `Stage changed to ${stages.find(s => s.id === newStage)?.label}`,
      });
      
      toast({ title: "Stage updated successfully" });
      loadOpportunities();
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-3 border-b space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Sales Pipeline</h1>
            <p className="text-xs text-muted-foreground">Manage opportunities</p>
          </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Opportunity</DialogTitle>
              <DialogDescription>Add a new lead to your pipeline</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Contact Name</Label>
                  <Input
                    value={newOpportunity.contact_name}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, contact_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Company</Label>
                  <Input
                    value={newOpportunity.company}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, company: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newOpportunity.contact_email}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, contact_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={newOpportunity.contact_phone}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, contact_phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Service Type</Label>
                <Input
                  value={newOpportunity.service_type}
                  onChange={(e) => setNewOpportunity({ ...newOpportunity, service_type: e.target.value })}
                  placeholder="e.g., Founder Story, Commercial Video"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Budget Min ($)</Label>
                  <Input
                    type="number"
                    value={newOpportunity.budget_min}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, budget_min: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Budget Max ($)</Label>
                  <Input
                    type="number"
                    value={newOpportunity.budget_max}
                    onChange={(e) => setNewOpportunity({ ...newOpportunity, budget_max: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={newOpportunity.notes}
                  onChange={(e) => setNewOpportunity({ ...newOpportunity, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <Button onClick={handleCreateOpportunity}>Create Opportunity</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Schedule Meeting Dialog */}
        <Dialog open={isMeetingDialogOpen} onOpenChange={setIsMeetingDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                Schedule Google Meet
              </DialogTitle>
              <DialogDescription>
                Schedule a video call with {selectedOpportunity?.contact_name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="meeting-title">
                  Meeting Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="meeting-title"
                  value={meetingData.title}
                  onChange={(e) => setMeetingData({ ...meetingData, title: e.target.value })}
                  placeholder="Strategy Call"
                  required
                />
              </div>
              <div>
                <Label htmlFor="meeting-date">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !meetingData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {meetingData.date ? format(meetingData.date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={meetingData.date}
                      onSelect={(date) => setMeetingData({ ...meetingData, date })}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="meeting-time">
                  Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="meeting-time"
                  type="time"
                  value={meetingData.time}
                  onChange={(e) => setMeetingData({ ...meetingData, time: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Select
                  value={meetingData.durationMinutes.toString()}
                  onValueChange={(value) => setMeetingData({ ...meetingData, durationMinutes: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="meeting-link">
                  Meeting Link <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="meeting-link"
                  type="url"
                  value={meetingData.meetingLink}
                  onChange={(e) => setMeetingData({ ...meetingData, meetingLink: e.target.value })}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Paste your Google Meet link here
                </p>
              </div>
              <div>
                <Label>Description (Optional)</Label>
                <Textarea
                  value={meetingData.description}
                  onChange={(e) => setMeetingData({ ...meetingData, description: e.target.value })}
                  rows={3}
                  placeholder="Meeting agenda..."
                />
              </div>
              <Button onClick={handleScheduleMeeting}>
                <CalendarIcon className="w-4 h-4 mr-2" />
                Create Meeting
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Metrics Dashboard */}
      {showMetrics && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 px-3">
          {/* Total Pipeline Value */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pipeline Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics.totalValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Weighted: ${metrics.weightedValue.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          {/* Win Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.conversionRates.overallWinRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg Deal: ${metrics.avgDealSize.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          {/* Hot Leads */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Hot Leads 🔥
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {metrics.hotCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Grade A opportunities
              </p>
            </CardContent>
          </Card>

          {/* Stale Opportunities */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Needs Follow-up
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {metrics.staleCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Stale opportunities
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Forecast */}
      {forecast && (
        <Card className="mb-6 mx-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Revenue Forecast - {forecast.month}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Conservative</p>
                <p className="text-xl font-bold text-green-600">
                  ${forecast.conservative.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">75% probability</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Likely</p>
                <p className="text-xl font-bold text-blue-600">
                  ${forecast.likely.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">50% probability</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Optimistic</p>
                <p className="text-xl font-bold text-purple-600">
                  ${forecast.optimistic.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">25% probability</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board - Horizontal Scroll */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden min-h-0">
        <div className="flex gap-3 p-3 h-full" style={{ minWidth: 'max-content' }}>
          {stages.map((stage) => {
            const stageOpportunities = getOpportunitiesByStage(stage.id);
            return (
              <div key={stage.id} className="w-64 flex flex-col h-full">
                <div className={`${stage.color} text-white px-3 py-1.5 rounded-t-lg flex items-center justify-between shrink-0`}>
                  <h3 className="font-semibold text-sm">{stage.label}</h3>
                  <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 text-xs">
                    {stageOpportunities.length}
                  </Badge>
                </div>
                <div className="bg-muted/30 p-2 space-y-2 flex-1 overflow-y-auto rounded-b-lg min-h-0">
                  {stageOpportunities.map((opp) => (
                    <Card 
                      key={opp.id} 
                      className={cn(
                        "cursor-move hover:shadow-lg transition-shadow",
                        isOpportunityStale(new Date(opp.last_activity_at || opp.updated_at), opp.stage) && "border-orange-500 border-2"
                      )}
                      draggable
                      onDragStart={() => handleDragStart(opp)}
                    >
                      <CardContent className="p-4">
                        {/* Header with Lead Grade */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{opp.contact_name}</h3>
                              {opp.lead_grade && (
                                <Badge className={getLeadGradeColor(opp.lead_grade)}>
                                  {getLeadGradeIcon(opp.lead_grade)} {opp.lead_grade}
                                </Badge>
                              )}
                            </div>
                            {opp.company && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                {opp.company}
                              </p>
                            )}
                          </div>
                          
                          {/* Quick Actions Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedOpportunity(opp);
                                setIsMeetingDialogOpen(true);
                              }}>
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                Schedule Meeting
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.location.href = `mailto:${opp.contact_email}`}>
                                <Mail className="w-4 h-4 mr-2" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteOpportunity(opp.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Budget */}
                        {opp.budget_max && (
                          <div className="flex items-center gap-2 text-sm mb-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-green-600">
                              ${opp.budget_max.toLocaleString()}
                            </span>
                          </div>
                        )}

                        {/* Days in Stage */}
                        {opp.days_in_stage !== undefined && (
                          <div className={cn(
                            "flex items-center gap-2 text-xs mb-2",
                            getDaysInStageColor(opp.days_in_stage)
                          )}>
                            <Clock className="w-3 h-3" />
                            {opp.days_in_stage} days in stage
                          </div>
                        )}

                        {/* Last Activity */}
                        <div className="text-xs text-muted-foreground mb-2">
                          Last activity: {formatDistanceToNow(new Date(opp.last_activity_at || opp.updated_at))} ago
                        </div>

                        {/* Stale Warning */}
                        {isOpportunityStale(new Date(opp.last_activity_at || opp.updated_at), opp.stage) && (
                          <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded mt-2">
                            <AlertCircle className="w-3 h-3" />
                            Needs follow-up!
                          </div>
                        )}

                        {/* Expected Close Date */}
                        {opp.expected_close_date && (
                          <div className={cn(
                            "text-xs mt-2",
                            isBefore(new Date(opp.expected_close_date), new Date()) ? "text-red-500" : "text-muted-foreground"
                          )}>
                            Close: {format(new Date(opp.expected_close_date), 'MMM d, yyyy')}
                            {isBefore(new Date(opp.expected_close_date), new Date()) && " (Overdue)"}
                          </div>
                        )}

                        {/* Service Type */}
                        {opp.service_type && (
                          <div className="text-xs text-muted-foreground mt-2 truncate">
                            {opp.service_type}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {stageOpportunities.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      No opportunities
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
