import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, CheckCircle2, AlertCircle, Play, Pause, Folder, DollarSign, User, Video, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const projectStatuses = [
  { id: "pre_production", label: "Pre-Production", icon: Clock, color: "text-blue-500" },
  { id: "in_production", label: "In Production", icon: Play, color: "text-purple-500" },
  { id: "post_production", label: "Post-Production", icon: Pause, color: "text-orange-500" },
  { id: "completed", label: "Completed", icon: CheckCircle2, color: "text-green-500" },
  { id: "on_hold", label: "On Hold", icon: AlertCircle, color: "text-red-500" },
];

export default function AdminProjects() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [clientAccounts, setClientAccounts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [scheduleMeetingDialog, setScheduleMeetingDialog] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    durationMinutes: 60
  });
  const [projectStats, setProjectStats] = useState<Record<string, number>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const [deleteFiles, setDeleteFiles] = useState(false);
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [newProject, setNewProject] = useState({
    project_name: "",
    project_type: "",
    shoot_date: undefined as Date | undefined,
    delivery_date: undefined as Date | undefined,
    notes: "",
    client_id: "",
  });

  useEffect(() => {
    loadProjects();
    loadBookings();
    loadClientAccounts();
    loadPayments();
  }, []);

  const loadProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProjects(data);
      updateProjectStats(data);
    }
  };

  const updateProjectStats = (projectList: any[]) => {
    const stats: Record<string, number> = {};
    projectStatuses.forEach(status => {
      stats[status.id] = projectList.filter(p => p.status === status.id).length;
    });
    setProjectStats(stats);
  };

  const loadBookings = async () => {
    const { data } = await supabase
      .from("custom_booking_requests")
      .select("*")
      .eq("status", "approved")
      .is("deleted_at", null);

    if (data) {
      setBookings(data);
    }
  };

  const loadClientAccounts = async () => {
    // Only load active clients (those with projects or approved bookings)
    const { data: clientData } = await supabase
      .from("client_accounts")
      .select("*")
      .or("project_id.not.is.null,booking_id.not.is.null");
    
    if (clientData) {
      // Fetch profile data for each client
      const clientsWithProfiles = await Promise.all(
        clientData.map(async (client) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", client.user_id)
            .single();
          return { ...client, profiles: profile };
        })
      );
      setClientAccounts(clientsWithProfiles);
    }
  };

  const loadPayments = async () => {
    const { data } = await supabase.from("payments").select("*");
    if (data) setPayments(data);
  };

  const getClientForProject = (projectId: string) => {
    return clientAccounts.find((c) => c.project_id === projectId);
  };

  const getPaymentsForProject = (bookingId: string) => {
    return payments.filter((p) => p.booking_id === bookingId);
  };

  const getTotalPaid = (bookingId: string) => {
    return getPaymentsForProject(bookingId)
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  };

  const updateProjectStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("projects")
      .update({ status })
      .eq("id", id);

    if (!error) {
      // Update local state immediately
      const updatedProjects = projects.map(p => 
        p.id === id ? { ...p, status } : p
      );
      setProjects(updatedProjects);
      updateProjectStats(updatedProjects);
      
      toast({ title: "Project status updated" });
    } else {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const getBookingForProject = (bookingId: string) => {
    return bookings.find((b) => b.id === bookingId);
  };

  const handleScheduleMeeting = async () => {
    if (!selectedProject) return;
    
    const clientAccount = getClientForProject(selectedProject.id);
    if (!clientAccount) {
      toast({ title: "No client account found", variant: "destructive" });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('meetings')
        .insert({
          project_id: selectedProject.id,
          client_id: clientAccount.id,
          title: meetingForm.title,
          description: meetingForm.description,
          scheduled_date: meetingForm.scheduledAt,
          duration_minutes: meetingForm.durationMinutes,
          meeting_type: 'planning',
          created_by: user?.id,
        });

      if (error) throw error;

      toast({ title: "Meeting scheduled successfully" });
      setScheduleMeetingDialog(false);
      setMeetingForm({ title: "", description: "", scheduledAt: "", durationMinutes: 60 });
    } catch (error: any) {
      toast({ title: "Failed to schedule meeting", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      // If user wants to delete files, delete them first
      if (deleteFiles) {
        // Get all files for this project
        const { data: files } = await supabase
          .from("project_files")
          .select("*")
          .eq("project_id", projectToDelete.id);

        if (files && files.length > 0) {
          // Delete files from storage
          for (const file of files) {
            const [bucket, ...pathParts] = file.file_path.split("/");
            const path = pathParts.join("/");
            
            await supabase.storage.from(bucket).remove([path]);
          }

          // Delete file records
          await supabase
            .from("project_files")
            .delete()
            .eq("project_id", projectToDelete.id);
        }
      }

      // Delete the project
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectToDelete.id);

      if (error) throw error;

      toast({ title: "Project deleted successfully" });
      loadProjects();
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      setDeleteFiles(false);
    } catch (error: any) {
      toast({ 
        title: "Failed to delete project", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  const handleCreateProject = async () => {
    console.log('Creating project with:', newProject);
    
    if (!newProject.project_name || !newProject.project_type) {
      toast({ title: "Project name and type are required", variant: "destructive" });
      return;
    }

    if (!newProject.project_name.trim()) {
      toast({ title: "Project name cannot be empty", variant: "destructive" });
      return;
    }

    setCreatingProject(true);
    try {
      const projectInsertData = {
        title: newProject.project_name.trim(), // Required by database
        project_name: newProject.project_name.trim(),
        project_type: newProject.project_type,
        shoot_date: newProject.shoot_date ? format(newProject.shoot_date, "yyyy-MM-dd") : null,
        delivery_date: newProject.delivery_date ? format(newProject.delivery_date, "yyyy-MM-dd") : null,
        notes: newProject.notes || null,
        status: "pre_production", // Must match database CHECK constraint and UI projectStatuses
        client_name: newProject.client_id ? "" : "Direct Project", // Satisfy NOT NULL constraint
        client_email: newProject.client_id ? "" : "admin@nvisionfilms.com", // Satisfy NOT NULL constraint
        client_id: newProject.client_id || null,
      };

      console.log('Inserting project:', projectInsertData);

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .insert(projectInsertData)
        .select()
        .single();

      if (projectError) {
        console.error('Project insert error:', projectError);
        throw projectError;
      }

      // If a client is selected, link the project to them
      if (newProject.client_id && projectData) {
        const { error: updateError } = await supabase
          .from("client_accounts")
          .update({ project_id: projectData.id })
          .eq("id", newProject.client_id);

        if (updateError) {
          console.error("Error linking project to client:", updateError);
          toast({ 
            title: "Project created but client link failed", 
            description: updateError.message, 
            variant: "destructive" 
          });
        }
      }

      toast({ title: "Project created successfully" });
      setCreateProjectDialogOpen(false);
      setNewProject({ project_name: "", project_type: "", shoot_date: undefined, delivery_date: undefined, notes: "", client_id: "" });
      loadProjects();
    } catch (error: any) {
      toast({ title: "Error creating project", description: error.message, variant: "destructive" });
    } finally {
      setCreatingProject(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = projectStatuses.find((s) => s.id === status);
    if (!statusConfig) return null;

    const Icon = statusConfig.icon;
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Icon className={`w-3 h-3 ${statusConfig.color}`} />
        {statusConfig.label}
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Projects</h1>
          <p className="text-sm md:text-base text-muted-foreground">Track production progress and deliverables</p>
        </div>
        
        <Dialog open={createProjectDialogOpen} onOpenChange={setCreateProjectDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>
                Create a new project to track
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="project_name">Project Name *</Label>
                <Input
                  id="project_name"
                  value={newProject.project_name}
                  onChange={(e) => setNewProject({ ...newProject, project_name: e.target.value })}
                  placeholder="My Project"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_type">Project Type *</Label>
                <Select value={newProject.project_type} onValueChange={(val) => setNewProject({ ...newProject, project_type: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="documentary">Documentary</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shoot_date">Shoot Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newProject.shoot_date && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {newProject.shoot_date ? format(newProject.shoot_date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={newProject.shoot_date}
                      onSelect={(date) => setNewProject({ ...newProject, shoot_date: date })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_date">Delivery Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newProject.delivery_date && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {newProject.delivery_date ? format(newProject.delivery_date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={newProject.delivery_date}
                      onSelect={(date) => setNewProject({ ...newProject, delivery_date: date })}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_assignment">Assign to Client (Optional)</Label>
                <Select value={newProject.client_id} onValueChange={(val) => setNewProject({ ...newProject, client_id: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="No client assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientAccounts.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.profiles?.full_name || client.profiles?.email || "Unknown Client"}
                        {client.company_name && ` (${client.company_name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_notes">Notes</Label>
                <Input
                  id="project_notes"
                  value={newProject.notes}
                  onChange={(e) => setNewProject({ ...newProject, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => {
                setCreateProjectDialogOpen(false);
                setNewProject({ project_name: "", project_type: "", shoot_date: undefined, delivery_date: undefined, notes: "", client_id: "" });
              }}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={creatingProject || !newProject.project_name || !newProject.project_type}>
                {creatingProject ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-5">
        {projectStatuses.map((status) => {
          const count = projectStats[status.id] || 0;
          const Icon = status.icon;
          return (
            <Card key={status.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${status.color}`} />
                  {status.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const booking = getBookingForProject(project.booking_id);
          const clientAccount = getClientForProject(project.id);
          const totalPaid = booking ? getTotalPaid(booking.id) : 0;
          const projectValue = booking ? parseFloat(String(booking.approved_price || booking.requested_price)) : 0;
          
          return (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{project.project_name}</CardTitle>
                    {getStatusBadge(project.status)}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {project.project_type}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {clientAccount && (
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm font-semibold">
                        {clientAccount.profiles?.full_name || "Client"}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{clientAccount.profiles?.email}</p>
                    {clientAccount.company_name && (
                      <p className="text-xs text-muted-foreground">{clientAccount.company_name}</p>
                    )}
                  </div>
                )}

                {booking && (
                  <div className="p-3 bg-primary/5 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Paid:</span>
                      <span className="font-semibold text-green-600">${totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Project Value:</span>
                      <span className="font-semibold">${projectValue.toLocaleString()}</span>
                    </div>
                    {totalPaid < projectValue && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Outstanding:</span>
                        <span className="font-semibold text-orange-600">${(projectValue - totalPaid).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                {project.shoot_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Shoot: {format(new Date(project.shoot_date), "MMM d, yyyy")}</span>
                  </div>
                )}

                {project.delivery_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Due: {format(new Date(project.delivery_date), "MMM d, yyyy")}</span>
                  </div>
                )}

                {project.revision_count > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Revisions: {project.revision_count}
                  </div>
                )}

                <div className="flex gap-2">
                  {clientAccount && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/clients/${clientAccount.id}/files`)}
                        className="flex-1"
                      >
                        <Folder className="w-4 h-4 mr-2" />
                        Files
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProject(project);
                          setScheduleMeetingDialog(true);
                        }}
                        className="flex-1"
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Schedule
                      </Button>
                    </>
                  )}
                  {booking && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/admin/payments")}
                      className="flex-1"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Payments
                    </Button>
                  )}
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" onClick={() => setSelectedProject(project)}>
                      Update Status
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Project Status</DialogTitle>
                      <DialogDescription>{project.project_name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Project Status</Label>
                        <Select
                          value={project.status}
                          onValueChange={(value) => updateProjectStatus(project.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {projectStatuses.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {project.notes && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-semibold mb-1">Notes:</p>
                          <p className="text-sm">{project.notes}</p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => {
                    setProjectToDelete(project);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {projects.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">No projects yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Approved bookings will automatically create projects
          </p>
        </Card>
      )}

      <Dialog open={scheduleMeetingDialog} onOpenChange={setScheduleMeetingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Google Meet</DialogTitle>
            <DialogDescription>
              {selectedProject?.project_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Meeting Title *</Label>
              <Input
                value={meetingForm.title}
                onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                placeholder="e.g., Project Kickoff Call"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={meetingForm.description || ""}
                onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
                placeholder="Optional meeting notes"
              />
            </div>
            <div>
              <Label>Date & Time *</Label>
              <Input
                type="datetime-local"
                value={meetingForm.scheduledAt}
                onChange={(e) => setMeetingForm({ ...meetingForm, scheduledAt: e.target.value })}
              />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Select
                value={meetingForm.durationMinutes.toString()}
                onValueChange={(value) => setMeetingForm({ ...meetingForm, durationMinutes: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleScheduleMeeting} className="w-full">
              Create Meeting
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{projectToDelete?.project_name}"?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="deleteFiles"
                checked={deleteFiles}
                onCheckedChange={(checked) => setDeleteFiles(checked as boolean)}
              />
              <Label htmlFor="deleteFiles" className="cursor-pointer">
                Also delete all client files associated with this project
              </Label>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => {
                setDeleteDialogOpen(false);
                setProjectToDelete(null);
                setDeleteFiles(false);
              }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteProject}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
