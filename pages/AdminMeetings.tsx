import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import railwayApi from "@/lib/railwayApi";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Video, Mail, User, Loader2, ExternalLink, Edit, Tag, Trash2, RefreshCw, Plus } from "lucide-react";
import { format, isPast, isFuture } from "date-fns";
import { cn } from "@/lib/utils";

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string;
  status: string;
  client_id: string | null;
  project_id: string | null;
  created_at: string;
  created_by: string;
  meeting_outcome: string | null;
  opportunity_id: string | null;
  google_event_id: string | null;
  meet_link: string | null;
}

export default function AdminMeetings() {
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);
  const [syncingMeetingId, setSyncingMeetingId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    date: undefined as Date | undefined,
    time: "10:00",
    duration_minutes: 60,
    description: "",
    location: "",
    syncToCalendar: true,
  });
  const [editForm, setEditForm] = useState({
    title: "",
    date: undefined as Date | undefined,
    time: "",
    duration_minutes: 30,
    meeting_link: "",
    description: "",
    meeting_outcome: "",
  });

  useEffect(() => {
    loadMeetings();
  }, []);

  // TODO: Implement real-time updates with WebSocket or polling
  useEffect(() => {
    // Placeholder for real-time subscription
  }, []);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const data = await railwayApi.meetings.getAll();

      if (data.error) throw data.error;
      setMeetings(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading meetings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    const meetingDate = new Date(meeting.scheduled_at);
    setEditForm({
      title: meeting.title,
      date: meetingDate,
      time: format(meetingDate, "HH:mm"),
      duration_minutes: meeting.duration_minutes,
      meeting_link: meeting.meeting_link,
      description: meeting.description || "",
      meeting_outcome: meeting.meeting_outcome || "",
    });
    setEditDialogOpen(true);
  };

  const handleDeleteMeeting = async () => {
    if (!meetingToDelete) return;

    try {
      console.log("🗑️ Deleting meeting:", meetingToDelete.id);

      await railwayApi.meetings.delete(meetingToDelete.id);
      console.log("✅ Meeting deleted successfully");

      toast({
        title: "Meeting deleted",
        description: "The meeting has been removed",
      });

      setDeleteDialogOpen(false);
      setMeetingToDelete(null);
      loadMeetings();
    } catch (error: any) {
      console.error("❌ Delete failed:", error);
      toast({
        title: "Error deleting meeting",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateMeeting = async () => {
    if (!selectedMeeting || !editForm.date) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("🔍 Updating meeting:", {
        meetingId: selectedMeeting.id,
        outcome: editForm.meeting_outcome,
        opportunityId: selectedMeeting.opportunity_id
      });

      const [hours, minutes] = editForm.time.split(':');
      const scheduledDateTime = new Date(editForm.date);
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await railwayApi.meetings.update(selectedMeeting.id, {
        title: editForm.title,
        description: editForm.description,
        scheduled_at: scheduledDateTime.toISOString(),
        duration_minutes: editForm.duration_minutes,
        meetingLink: editForm.meetingLink,
        meeting_outcome: editForm.meeting_outcome,
      });

      if (error) {
        console.error("❌ Error updating meeting:", error);
        throw error;
      }

      console.log("✅ Meeting updated successfully");

      // If meeting has outcome and is linked to an opportunity, update pipeline stage
      if (editForm.meeting_outcome && selectedMeeting.opportunity_id) {
        console.log("🎯 Updating opportunity stage...");
        
        const stageMap: Record<string, string> = {
          "no_show": "lost",
          "not_qualified": "lost",
          "qualified": "qualified",
          "proposal_sent": "proposal",
          "negotiating": "negotiation",
          "won": "won",
        };

        const newStage = stageMap[editForm.meeting_outcome];
        if (newStage) {
          console.log(`📊 Changing stage to: ${newStage}`);
          
          await railwayApi.opportunities.update(selectedMeeting.opportunity_id, { 
            stage: newStage 
          });
          console.log("✅ Opportunity stage updated!");
        }
      } else if (editForm.meeting_outcome) {
        console.warn("⚠️ Meeting outcome set but no opportunity_id linked");
      }

      toast({
        title: "Meeting updated",
        description: selectedMeeting.opportunity_id && editForm.meeting_outcome 
          ? "Meeting and pipeline stage updated" 
          : "Meeting details have been saved",
      });

      setEditDialogOpen(false);
      loadMeetings();
    } catch (error: any) {
      console.error("❌ Update failed:", error);
      toast({
        title: "Error updating meeting",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateMeeting = async () => {
    if (!createForm.title || !createForm.date) {
      toast({
        title: "Missing information",
        description: "Please enter a title and select a date",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const [hours, minutes] = createForm.time.split(':');
      const scheduledDateTime = new Date(createForm.date);
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Create meeting in database
      const meeting = await railwayApi.meetings.create({
        title: createForm.title,
        description: createForm.description,
        scheduled_at: scheduledDateTime.toISOString(),
        duration_minutes: createForm.duration_minutes,
        location: createForm.location,
        status: 'scheduled',
      });

      // Sync to Google Calendar if requested
      if (createForm.syncToCalendar && meeting?.id) {
        try {
          const calResult = await railwayApi.calendar.syncMeeting(meeting.id);
          toast({
            title: "Meeting created & synced",
            description: calResult.meetLink ? "Google Meet link generated!" : "Added to Google Calendar",
          });
        } catch (calError) {
          toast({
            title: "Meeting created",
            description: "Created but calendar sync failed - you can sync later",
          });
        }
      } else {
        toast({
          title: "Meeting created",
          description: "Meeting scheduled successfully",
        });
      }

      setCreateDialogOpen(false);
      setCreateForm({
        title: "",
        date: undefined,
        time: "10:00",
        duration_minutes: 60,
        description: "",
        location: "",
        syncToCalendar: true,
      });
      loadMeetings();
    } catch (error: any) {
      toast({
        title: "Error creating meeting",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSyncToCalendar = async (meeting: Meeting) => {
    setSyncingMeetingId(meeting.id);
    try {
      if (meeting.google_event_id) {
        // Update existing event
        await railwayApi.calendar.updateEvent(meeting.id);
        toast({
          title: "Calendar updated",
          description: "Meeting synced to Google Calendar",
        });
      } else {
        // Create new event
        const result = await railwayApi.calendar.syncMeeting(meeting.id);
        toast({
          title: "Synced to Google Calendar",
          description: result.meetLink ? "Google Meet link created!" : "Event created",
        });
      }
      loadMeetings();
    } catch (error: any) {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSyncingMeetingId(null);
    }
  };

  const getFilteredMeetings = () => {
    const now = new Date();
    return meetings.filter((meeting) => {
      const meetingDate = new Date(meeting.scheduled_at);
      if (filter === "upcoming") return isFuture(meetingDate);
      if (filter === "past") return isPast(meetingDate);
      return true;
    });
  };

  const filteredMeetings = getFilteredMeetings();
  const upcomingCount = meetings.filter(m => isFuture(new Date(m.scheduled_at))).length;
  const pastCount = meetings.filter(m => isPast(new Date(m.scheduled_at))).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Meetings</h1>
          <p className="text-muted-foreground mt-1">View and manage all scheduled meetings</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Meeting</DialogTitle>
              <DialogDescription>
                Schedule a new meeting and optionally sync to Google Calendar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-title">Title *</Label>
                <Input
                  id="create-title"
                  placeholder="Meeting with client..."
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {createForm.date ? format(createForm.date, "PPP") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={createForm.date}
                        onSelect={(date) => setCreateForm({ ...createForm, date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-time">Time</Label>
                  <Input
                    id="create-time"
                    type="time"
                    value={createForm.time}
                    onChange={(e) => setCreateForm({ ...createForm, time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select
                    value={String(createForm.duration_minutes)}
                    onValueChange={(v) => setCreateForm({ ...createForm, duration_minutes: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-location">Location</Label>
                  <Input
                    id="create-location"
                    placeholder="Office, Zoom, etc."
                    value={createForm.location}
                    onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-description">Description</Label>
                <Textarea
                  id="create-description"
                  placeholder="Meeting notes..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="sync-calendar"
                  checked={createForm.syncToCalendar}
                  onChange={(e) => setCreateForm({ ...createForm, syncToCalendar: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="sync-calendar" className="text-sm font-normal cursor-pointer">
                  Sync to Google Calendar (creates Meet link)
                </Label>
              </div>

              <Button 
                className="w-full" 
                onClick={handleCreateMeeting}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Meeting
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Past</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pastCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === "upcoming" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("upcoming")}
        >
          Upcoming ({upcomingCount})
        </Button>
        <Button
          variant={filter === "past" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("past")}
        >
          Past ({pastCount})
        </Button>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All ({meetings.length})
        </Button>
      </div>

      {/* Meetings List */}
      <div className="grid gap-4">
        {filteredMeetings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No {filter !== "all" && filter} meetings found
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMeetings.map((meeting) => {
            const meetingDate = new Date(meeting.scheduled_at);
            const isUpcoming = isFuture(meetingDate);

            return (
              <Card key={meeting.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{meeting.title}</CardTitle>
                      {meeting.description && (
                        <p className="text-sm text-muted-foreground">{meeting.description}</p>
                      )}
                      {meeting.meeting_outcome && (
                        <Badge variant="outline" className="mt-2">
                          <Tag className="w-3 h-3 mr-1" />
                          {meeting.meeting_outcome.replace(/_/g, ' ')}
                        </Badge>
                      )}
                      {meeting.opportunity_id && (
                        <Badge variant="secondary" className="mt-2 ml-2">
                          🔗 Linked to Pipeline
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {meeting.google_event_id && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <Calendar className="w-3 h-3 mr-1" />
                          Synced
                        </Badge>
                      )}
                      <Badge variant={isUpcoming ? "default" : "secondary"}>
                        {meeting.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={meeting.google_event_id ? "Update in Google Calendar" : "Sync to Google Calendar"}
                        onClick={() => handleSyncToCalendar(meeting)}
                        disabled={syncingMeetingId === meeting.id}
                      >
                        {syncingMeetingId === meeting.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditMeeting(meeting)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setMeetingToDelete(meeting);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{format(meetingDate, "PPP")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{format(meetingDate, "p")} ({meeting.duration_minutes} min)</span>
                    </div>
                  </div>

                  {(meeting.meeting_link || meeting.meet_link) && (
                    <div className="pt-3 border-t flex gap-2">
                      {meeting.meet_link && (
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => window.open(meeting.meet_link!, "_blank")}
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Join Google Meet
                          <ExternalLink className="w-3 h-3 ml-2" />
                        </Button>
                      )}
                      {meeting.meeting_link && meeting.meeting_link !== meeting.meet_link && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => window.open(meeting.meeting_link, "_blank")}
                        >
                          <Video className="w-4 h-4 mr-2" />
                          {meeting.meet_link ? "Alt Link" : "Join Meeting"}
                          <ExternalLink className="w-3 h-3 ml-2" />
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Created {format(new Date(meeting.created_at), "PPp")}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Meeting Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this meeting? This action cannot be undone.
              {meetingToDelete && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="font-semibold">{meetingToDelete.title}</p>
                  <p className="text-sm mt-1">
                    {format(new Date(meetingToDelete.scheduled_at), "PPP 'at' p")}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMeeting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Meeting Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Meeting</DialogTitle>
            <DialogDescription>Update meeting details and outcome</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Meeting Title *</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-date">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editForm.date && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {editForm.date ? format(editForm.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={editForm.date}
                    onSelect={(date) => setEditForm({ ...editForm, date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="edit-time">Time *</Label>
              <Input
                id="edit-time"
                type="time"
                value={editForm.time}
                onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-duration">Duration (minutes)</Label>
              <Select
                value={editForm.duration_minutes.toString()}
                onValueChange={(value) => setEditForm({ ...editForm, duration_minutes: parseInt(value) })}
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
              <Label htmlFor="edit-link">Meeting Link</Label>
              <Input
                id="edit-link"
                type="url"
                value={editForm.meeting_link}
                onChange={(e) => setEditForm({ ...editForm, meeting_link: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-outcome">Meeting Outcome (updates pipeline)</Label>
              {!selectedMeeting?.opportunity_id && (
                <p className="text-xs text-amber-600 mb-2">
                  ⚠️ This meeting is not linked to a pipeline opportunity. Outcome won't update pipeline.
                </p>
              )}
              {selectedMeeting?.opportunity_id && (
                <p className="text-xs text-green-600 mb-2">
                  ✓ Linked to opportunity - will update pipeline stage
                </p>
              )}
              <Select
                value={editForm.meeting_outcome}
                onValueChange={(value) => setEditForm({ ...editForm, meeting_outcome: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_show">No Show → Lost</SelectItem>
                  <SelectItem value="not_qualified">Not Qualified → Lost</SelectItem>
                  <SelectItem value="qualified">Qualified → Qualified</SelectItem>
                  <SelectItem value="proposal_sent">Proposal Sent → Proposal</SelectItem>
                  <SelectItem value="negotiating">Negotiating → Negotiation</SelectItem>
                  <SelectItem value="won">Won → Won</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedMeeting?.opportunity_id 
                  ? "Selecting an outcome will automatically update the pipeline stage"
                  : "Create meetings from the Pipeline page to link them to opportunities"
                }
              </p>
            </div>
            <Button onClick={handleUpdateMeeting} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
