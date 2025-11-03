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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Mail, Phone, Building, DollarSign, Trash2, Video, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOpportunities = async () => {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOpportunities(data);
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

  const updateStage = async (id: string, newStage: string) => {
    // Optimistic update - immediately move the card
    setOpportunities(prev => 
      prev.map(opp => opp.id === id ? { ...opp, stage: newStage } : opp)
    );

    const { error } = await supabase
      .from("opportunities")
      .update({ stage: newStage })
      .eq("id", id);

    if (error) {
      toast({ 
        title: "Error updating stage", 
        description: error.message, 
        variant: "destructive" 
      });
      // Revert on error
      loadOpportunities();
    } else {
      toast({ title: "Stage updated successfully" });
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
      
      const { data, error } = await supabase.functions.invoke("create-meeting", {
        body: {
          projectId: null, // No project yet for opportunities
          clientId: null, // No client account yet
          opportunityId: selectedOpportunity.id,
          clientEmail: selectedOpportunity.contact_email,
          clientName: selectedOpportunity.contact_name,
          title: meetingData.title,
          description: meetingData.description || `Meeting with ${selectedOpportunity.contact_name} - ${selectedOpportunity.service_type}`,
          scheduledAt: scheduledDateTime.toISOString(),
          durationMinutes: meetingData.durationMinutes,
          meetingLink: meetingData.meetingLink,
        },
      });

      if (error) {
        console.error("❌ Edge function error:", error);
        throw error;
      }

      console.log("✅ Meeting created with opportunity link:", data);

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
                    <Card key={opp.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="p-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm line-clamp-1 flex-1">{opp.contact_name}</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-1"
                            onClick={() => {
                              if (confirm(`Delete opportunity for ${opp.contact_name}?`)) {
                                handleDeleteOpportunity(opp.id);
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        {opp.company && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Building className="w-3 h-3 shrink-0" />
                            <span className="truncate">{opp.company}</span>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="p-3 pt-0 space-y-1.5">
                        <div className="flex items-center gap-1 text-xs">
                          <Mail className="w-3 h-3 shrink-0 text-muted-foreground" />
                          <span className="truncate">{opp.contact_email}</span>
                        </div>
                        {opp.contact_phone && (
                          <div className="flex items-center gap-1 text-xs">
                            <Phone className="w-3 h-3 shrink-0 text-muted-foreground" />
                            <span className="truncate">{opp.contact_phone}</span>
                          </div>
                        )}
                        {opp.service_type && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {opp.service_type}
                          </Badge>
                        )}
                        {(opp.budget_min || opp.budget_max) && (
                          <div className="flex items-center gap-1 text-xs font-semibold text-primary pt-1">
                            <DollarSign className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {opp.budget_min && opp.budget_max
                                ? opp.budget_min === opp.budget_max
                                  ? `$${opp.budget_min.toLocaleString()}`
                                  : `$${opp.budget_min.toLocaleString()}-$${opp.budget_max.toLocaleString()}`
                                : opp.budget_min
                                ? `$${opp.budget_min.toLocaleString()}+`
                                : `≤$${opp.budget_max.toLocaleString()}`}
                            </span>
                          </div>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={() => {
                              setSelectedOpportunity(opp);
                              setMeetingData({
                                title: `Strategy Call - ${opp.contact_name}`,
                                date: undefined,
                                time: "09:00",
                                durationMinutes: 30,
                                description: `Discuss ${opp.service_type} project`,
                                meetingLink: "",
                              });
                              setIsMeetingDialogOpen(true);
                            }}
                          >
                            <Video className="w-3 h-3 mr-1" />
                            Schedule
                          </Button>
                        </div>
                        <Select value={opp.stage} onValueChange={(value) => updateStage(opp.id, value)}>
                          <SelectTrigger className="w-full mt-2 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {stages.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
