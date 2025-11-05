import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { UserPlus, Loader2, Mail, Building2, Folder, MoreVertical, Edit, Ban, CheckCircle, Trash2, Search, AlertCircle, Plus, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ClientAccount {
  id: string;
  user_id: string;
  project_id: string | null;
  booking_id: string | null;
  company_name: string | null;
  status: string;
  storage_limit_gb: number;
  storage_used_gb: number;
  created_at: string;
  profiles?: { email: string; full_name: string | null };
  projects?: { project_name: string };
}

const AdminClients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientAccount | null>(null);
  const [updating, setUpdating] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ClientAccount[]>([]);
  const [selectedExistingClient, setSelectedExistingClient] = useState<ClientAccount | null>(null);
  const [isLinkingMode, setIsLinkingMode] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendingConfirmation, setResendingConfirmation] = useState(false);

  const [newProject, setNewProject] = useState({
    project_name: "",
    project_type: "",
    shoot_date: undefined as Date | undefined,
    delivery_date: undefined as Date | undefined,
    notes: "",
  });

  const [newClient, setNewClient] = useState({
    email: "",
    password: "",
    full_name: "",
    company_name: "",
    project_id: "",
    booking_id: "",
  });

  const [editForm, setEditForm] = useState({
    full_name: "",
    storage_limit_gb: 5,
    project_id: "",
    booking_id: "",
    company_name: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const searchClients = async () => {
      if (clientSearchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .or(`email.ilike.%${clientSearchQuery}%,full_name.ilike.%${clientSearchQuery}%`);

        if (!profilesData || profilesData.length === 0) {
          setSearchResults([]);
          return;
        }

        const userIds = profilesData.map(p => p.id);
        
        const { data: clientsData } = await supabase
          .from("client_accounts")
          .select("*")
          .in("user_id", userIds);

        if (clientsData) {
          // Manually join profiles and projects
          const enrichedClients = await Promise.all(
            clientsData.map(async (client) => {
              const [profileRes, projectRes] = await Promise.all([
                supabase.from("profiles").select("email, full_name").eq("id", client.user_id).single(),
                client.project_id
                  ? supabase.from("projects").select("project_name").eq("id", client.project_id).single()
                  : Promise.resolve({ data: null, error: null }),
              ]);

              return {
                ...client,
                profiles: profileRes.data,
                projects: projectRes.data,
              };
            })
          );

          setSearchResults(enrichedClients);
        }
      } catch (error) {
        console.error("Error searching clients:", error);
      }
    };

    const debounce = setTimeout(searchClients, 300);
    return () => clearTimeout(debounce);
  }, [clientSearchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [clientsRes, projectsRes, bookingsRes] = await Promise.all([
        supabase
          .from("client_accounts")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("projects").select("*").order("project_name"),
        supabase
          .from("custom_booking_requests")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false }),
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (projectsRes.error) throw projectsRes.error;
      if (bookingsRes.error) throw bookingsRes.error;

      // Fetch profiles and projects separately for each client
      const clientsWithData = await Promise.all(
        (clientsRes.data || []).map(async (client) => {
          const [profileRes, projectRes] = await Promise.all([
            supabase.from("profiles").select("email, full_name").eq("id", client.user_id).single(),
            client.project_id
              ? supabase.from("projects").select("project_name").eq("id", client.project_id).single()
              : Promise.resolve({ data: null, error: null }),
          ]);

          return {
            ...client,
            profiles: profileRes.data,
            projects: projectRes.data,
          };
        })
      );

      setClients(clientsWithData);
      setProjects(projectsRes.data || []);
      setBookings(bookingsRes.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error(`Error loading data: ${error.message}`);
      // Set empty arrays to prevent blank screen
      setClients([]);
      setProjects([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkExistingClient = async () => {
    if (!selectedExistingClient) return;

    setCreating(true);
    try {
      const updateData: any = {};
      
      if (newClient.project_id) updateData.project_id = newClient.project_id;
      if (newClient.booking_id) updateData.booking_id = newClient.booking_id;
      if (newClient.company_name) updateData.company_name = newClient.company_name;

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from("client_accounts")
          .update(updateData)
          .eq("id", selectedExistingClient.id);

        if (error) throw error;
      }

      // TODO: Send notification email (requires email service integration)
      // For now, skip email notification
      
      toast.success("Existing client linked successfully");
      resetCreateDialog();
      fetchData();
    } catch (error: any) {
      toast.error(`Error linking client: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.email || !newClient.password) {
      toast.error("Email and password are required");
      return;
    }

    setCreating(true);
    try {
      // Call Edge Function to create user (requires service role)
      const { data, error } = await supabase.functions.invoke('create-client-user', {
        body: {
          email: newClient.email,
          password: newClient.password,
          full_name: newClient.full_name,
          company_name: newClient.company_name,
          project_id: newClient.project_id || null,
          booking_id: newClient.booking_id || null,
        }
      });

      console.log('Edge Function response:', { data, error });
      console.log('Response data type:', typeof data);
      console.log('Response data:', JSON.stringify(data, null, 2));

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(`Function error: ${error.message || JSON.stringify(error)}`);
      }
      if (data?.error) {
        console.error('Edge Function returned error:', data.error);
        throw new Error(`Function returned: ${data.error}`);
      }
      if (!data?.success) {
        throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
      }

      toast.success("Client account created successfully");
      resetCreateDialog();
      fetchData();
    } catch (error: any) {
      console.error('Full error:', error);
      toast.error(`Error creating client: ${error.message || JSON.stringify(error)}`);
    } finally {
      setCreating(false);
    }
  };

  const resetCreateDialog = () => {
    setCreateDialogOpen(false);
    setNewClient({ email: "", password: "", full_name: "", company_name: "", project_id: "", booking_id: "" });
    setClientSearchQuery("");
    setSearchResults([]);
    setSelectedExistingClient(null);
    setIsLinkingMode(false);
  };

  const handleEditClient = (client: ClientAccount) => {
    setSelectedClient(client);
    setEditForm({
      full_name: client.profiles?.full_name || "",
      storage_limit_gb: client.storage_limit_gb,
      project_id: client.project_id || "",
      booking_id: client.booking_id || "",
      company_name: client.company_name || "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdateClient = async () => {
    if (!selectedClient) return;

    setUpdating(true);
    try {
      // Update client account
      const { error: accountError } = await supabase
        .from("client_accounts")
        .update({
          storage_limit_gb: editForm.storage_limit_gb,
          project_id: editForm.project_id || null,
          booking_id: editForm.booking_id || null,
          company_name: editForm.company_name || null,
        })
        .eq("id", selectedClient.id);

      if (accountError) throw accountError;

      // Update profile name
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name || null,
        })
        .eq("id", selectedClient.user_id);

      if (profileError) throw profileError;

      toast.success("Client updated successfully");
      setEditDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(`Error updating client: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleStatus = async (client: ClientAccount) => {
    const newStatus = client.status === "active" ? "suspended" : "active";
    
    try {
      const { error } = await supabase
        .from("client_accounts")
        .update({ status: newStatus })
        .eq("id", client.id);

      if (error) throw error;

      toast.success(`Client ${newStatus === "active" ? "activated" : "suspended"}`);
      fetchData();
    } catch (error: any) {
      toast.error(`Error updating status: ${error.message}`);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;

    setUpdating(true);
    try {
      // Call Edge Function to delete both client account and auth user
      const { data, error } = await supabase.functions.invoke('delete-client-user', {
        body: { user_id: selectedClient.user_id }
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(`Function error: ${error.message || JSON.stringify(error)}`);
      }
      
      if (data?.error) {
        console.error('Edge Function returned error:', data.error);
        throw new Error(`Function returned: ${data.error}`);
      }

      toast.success("Client and user account deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedClient(null);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast.error(`Error deleting client: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.project_name || !newProject.project_type || !selectedClient) {
      toast.error("Project name and type are required");
      return;
    }

    setCreatingProject(true);
    try {
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .insert({
          project_name: newProject.project_name,
          project_type: newProject.project_type,
          shoot_date: newProject.shoot_date ? format(newProject.shoot_date, "yyyy-MM-dd") : null,
          delivery_date: newProject.delivery_date ? format(newProject.delivery_date, "yyyy-MM-dd") : null,
          notes: newProject.notes || null,
          status: "pre_production",
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Link project to client
      const { error: updateError } = await supabase
        .from("client_accounts")
        .update({ project_id: projectData.id })
        .eq("id", selectedClient.id);

      if (updateError) throw updateError;

      toast.success("Project created and linked to client");
      setCreateProjectDialogOpen(false);
      setNewProject({ project_name: "", project_type: "", shoot_date: undefined, delivery_date: undefined, notes: "" });
      setSelectedClient(null);
      fetchData();
    } catch (error: any) {
      toast.error(`Error creating project: ${error.message}`);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!resendEmail) {
      toast.error("Please enter an email address");
      return;
    }

    setResendingConfirmation(true);
    try {
      // Use Supabase auth resend
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail,
      });

      if (error) throw error;

      toast.success("Confirmation email resent successfully");
      setResendEmail("");
    } catch (error: any) {
      toast.error(`Error resending confirmation: ${error.message}`);
    } finally {
      setResendingConfirmation(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Client Management</h1>
          <p className="text-muted-foreground mt-1">Manage client portal accounts</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 md:flex-initial">
                <Mail className="w-4 h-4 mr-2" />
                Resend Confirmation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Resend Confirmation Email</DialogTitle>
                <DialogDescription>
                  Send a new confirmation email to a user who hasn't verified their account
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="resend-email">Email Address</Label>
                  <Input
                    id="resend-email"
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <Button 
                  onClick={handleResendConfirmation} 
                  disabled={resendingConfirmation || !resendEmail}
                  className="w-full"
                >
                  {resendingConfirmation ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Confirmation Email"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 md:flex-initial">
                <UserPlus className="w-4 h-4 mr-2" />
                Create Client Account
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Client Account</DialogTitle>
              <DialogDescription>
                Search for existing clients to prevent duplicates, or create a new account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {!isLinkingMode && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="client-search">Search Existing Clients</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="client-search"
                        value={clientSearchQuery}
                        onChange={(e) => setClientSearchQuery(e.target.value)}
                        placeholder="Search by name, email, or company..."
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                      <Label className="text-sm font-medium">Found {searchResults.length} existing client(s):</Label>
                      {searchResults.map((client) => (
                        <Card 
                          key={client.id} 
                          className="cursor-pointer hover:border-primary transition-colors p-3"
                          onClick={() => {
                            setSelectedExistingClient(client);
                            setIsLinkingMode(true);
                            setNewClient({
                              ...newClient,
                              email: client.profiles?.email || "",
                              full_name: client.profiles?.full_name || "",
                              company_name: client.company_name || "",
                            });
                          }}
                        >
                          <div className="space-y-1">
                            <div className="font-medium">{client.profiles?.full_name || "No Name"}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              {client.profiles?.email}
                            </div>
                            {client.company_name && (
                              <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <Building2 className="w-3 h-3" />
                                {client.company_name}
                              </div>
                            )}
                            {client.projects && (
                              <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <Folder className="w-3 h-3" />
                                Project: {client.projects.project_name}
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {clientSearchQuery.length > 0 && searchResults.length === 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No existing clients found. You can proceed to create a new account below.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              {isLinkingMode && selectedExistingClient && (
                <Alert className="border-primary">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Linking to existing client:</div>
                    <div className="text-sm">{selectedExistingClient.profiles?.full_name} ({selectedExistingClient.profiles?.email})</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setIsLinkingMode(false);
                        setSelectedExistingClient(null);
                        setNewClient({ ...newClient, email: "", full_name: "", company_name: "" });
                      }}
                    >
                      Cancel - Create New Instead
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {!isLinkingMode && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      placeholder="client@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newClient.password}
                      onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={newClient.full_name}
                      onChange={(e) => setNewClient({ ...newClient, full_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={newClient.company_name}
                      onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
                      placeholder="Company Inc."
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="project">Link to Project</Label>
                <Select value={newClient.project_id} onValueChange={(val) => setNewClient({ ...newClient, project_id: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.project_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking">Link to Booking</Label>
                <Select value={newClient.booking_id} onValueChange={(val) => setNewClient({ ...newClient, booking_id: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select booking (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        {booking.client_name || booking.company || "Client"} - {booking.service_type || "Service"} ({booking.client_email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={isLinkingMode ? handleLinkExistingClient : handleCreateClient} 
                disabled={creating || (!isLinkingMode && (!newClient.email || !newClient.password))} 
                className="w-full"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isLinkingMode ? "Linking..." : "Creating..."}
                  </>
                ) : (
                  isLinkingMode ? "Link to Existing Client" : "Create New Account"
                )}
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <Card 
            key={client.id} 
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate(`/admin/clients/${client.id}/files`)}
          >
            <CardHeader>
              <CardTitle className="flex items-start justify-between gap-2 text-base">
                <span className="truncate">{client.profiles?.full_name || client.profiles?.email || "No Name"}</span>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Badge variant={client.status === "active" ? "default" : "secondary"} className="shrink-0">
                    {client.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/admin/clients/${client.id}/files`)}>
                        <Folder className="h-4 w-4 mr-2" />
                        Manage Files
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedClient(client);
                        setCreateProjectDialogOpen(true);
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEditClient(client)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Client
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(client)}>
                        {client.status === "active" ? (
                          <>
                            <Ban className="h-4 w-4 mr-2" />
                            Suspend
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedClient(client);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{client.profiles?.email}</span>
              </div>
              {client.company_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{client.company_name}</span>
                </div>
              )}
              {client.projects && (
                <div className="flex items-center gap-2 text-sm">
                  <Folder className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{client.projects.project_name}</span>
                </div>
              )}
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground">Storage</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-medium">
                    {(client.storage_used_gb || 0).toFixed(2)} / {client.storage_limit_gb || 0} GB
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {client.storage_limit_gb ? ((Number(client.storage_used_gb || 0) / client.storage_limit_gb) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clients.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserPlus className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">No client accounts yet. Create one to get started.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Client Account</DialogTitle>
            <DialogDescription>
              Update client details and storage allocation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Full Name</Label>
              <Input
                id="edit_name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_storage">Storage Limit (GB)</Label>
              <Input
                id="edit_storage"
                type="number"
                value={editForm.storage_limit_gb}
                onChange={(e) => setEditForm({ ...editForm, storage_limit_gb: parseInt(e.target.value) })}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_company">Company Name</Label>
              <Input
                id="edit_company"
                value={editForm.company_name}
                onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                placeholder="Company Inc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_project">Link to Project</Label>
              <Select value={editForm.project_id || "none"} onValueChange={(val) => setEditForm({ ...editForm, project_id: val === "none" ? "" : val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_booking">Link to Booking</Label>
              <Select value={editForm.booking_id || "none"} onValueChange={(val) => setEditForm({ ...editForm, booking_id: val === "none" ? "" : val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select booking (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {bookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.client_name || booking.company || "Client"} - {booking.service_type || "Service"} ({booking.client_email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateClient} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the client account for {selectedClient?.profiles?.email}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedClient(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} disabled={updating} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={createProjectDialogOpen} onOpenChange={setCreateProjectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Create a new project for {selectedClient?.profiles?.full_name || selectedClient?.profiles?.email}
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
              <Label htmlFor="project_notes">Notes</Label>
              <Input
                id="project_notes"
                value={newProject.notes}
                onChange={(e) => setNewProject({ ...newProject, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => {
              setCreateProjectDialogOpen(false);
              setNewProject({ project_name: "", project_type: "", shoot_date: undefined, delivery_date: undefined, notes: "" });
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={creatingProject || !newProject.project_name || !newProject.project_type}>
              {creatingProject ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClients;
