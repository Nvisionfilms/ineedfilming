import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Plus, 
  Film, 
  Calendar as CalendarIcon, 
  Edit, 
  Trash2, 
  Video,
  CheckCircle,
  Clock,
  PlayCircle
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Episode {
  id: string;
  project_id: string;
  episode_number: number;
  title: string;
  description: string;
  story_arc: string;
  filming_date?: Date;
  delivery_date?: Date;
  status: "planning" | "filming" | "editing" | "delivered";
  duration_minutes?: number;
  notes?: string;
  client_id?: string;
  created_at: string;
}

interface Project {
  id: string;
  project_name: string;
  client_id: string;
}

export default function AdminEpisodePlanner() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [formData, setFormData] = useState({
    episode_number: 1,
    title: "",
    description: "",
    story_arc: "",
    filming_date: undefined as Date | undefined,
    delivery_date: undefined as Date | undefined,
    status: "planning" as Episode["status"],
    duration_minutes: 0,
    notes: "",
    client_id: "",
  });

  useEffect(() => {
    loadProjects();
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadEpisodes(selectedProject);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, project_name, client_id")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
      
      if (data && data.length > 0) {
        setSelectedProject(data[0].id);
      }
    } catch (error: any) {
      toast.error(`Error loading projects: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      // Only load active clients (those with projects or approved bookings)
      const { data, error } = await supabase
        .from("client_accounts")
        .select("id, company_name, user_id, project_id, booking_id")
        .or("project_id.not.is.null,booking_id.not.is.null")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error("Error loading clients:", error.message);
    }
  };

  const loadEpisodes = async (projectId: string) => {
    try {
      // Note: You'll need to create an 'episodes' table in Supabase
      // For now, this is a placeholder structure
      const { data, error } = await supabase
        .from("episodes")
        .select("*")
        .eq("project_id", projectId)
        .order("episode_number", { ascending: true });

      if (error) {
        // Table might not exist yet
        console.log("Episodes table not found - create it in Supabase");
        setEpisodes([]);
        return;
      }

      setEpisodes(data || []);
    } catch (error: any) {
      console.log("Error loading episodes:", error.message);
      setEpisodes([]);
    }
  };

  const handleSaveEpisode = async () => {
    if (!selectedProject) {
      toast.error("Please select a project first");
      return;
    }
    
    if (!formData.title) {
      toast.error("Please enter an episode title");
      return;
    }

    try {
      const episodeData = {
        project_id: selectedProject,
        episode_number: formData.episode_number,
        title: formData.title,
        description: formData.description,
        story_arc: formData.story_arc,
        filming_date: formData.filming_date?.toISOString(),
        delivery_date: formData.delivery_date?.toISOString(),
        status: formData.status,
        duration_minutes: formData.duration_minutes || null,
        notes: formData.notes,
        client_id: formData.client_id || null,
      };

      if (editingEpisode) {
        const { error } = await supabase
          .from("episodes")
          .update(episodeData)
          .eq("id", editingEpisode.id);

        if (error) throw error;
        toast.success("Episode updated successfully!");
      } else {
        const { error } = await supabase
          .from("episodes")
          .insert([episodeData]);

        if (error) throw error;
        toast.success("Episode created successfully!");
      }

      setDialogOpen(false);
      resetForm();
      loadEpisodes(selectedProject);
    } catch (error: any) {
      toast.error(`Error saving episode: ${error.message}`);
    }
  };

  const handleDeleteEpisode = async (id: string) => {
    if (!confirm("Are you sure you want to delete this episode?")) return;

    try {
      const { error } = await supabase
        .from("episodes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Episode deleted successfully!");
      loadEpisodes(selectedProject);
    } catch (error: any) {
      toast.error(`Error deleting episode: ${error.message}`);
    }
  };

  const handleEditEpisode = (episode: Episode) => {
    setEditingEpisode(episode);
    setFormData({
      episode_number: episode.episode_number,
      title: episode.title,
      description: episode.description,
      story_arc: episode.story_arc,
      filming_date: episode.filming_date ? new Date(episode.filming_date) : undefined,
      delivery_date: episode.delivery_date ? new Date(episode.delivery_date) : undefined,
      status: episode.status,
      duration_minutes: episode.duration_minutes || 0,
      notes: episode.notes || "",
      client_id: episode.client_id || "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingEpisode(null);
    setFormData({
      episode_number: episodes.length + 1,
      title: "",
      description: "",
      story_arc: "",
      filming_date: undefined,
      delivery_date: undefined,
      status: "planning",
      duration_minutes: 0,
      notes: "",
      client_id: "",
    });
  };

  const getStatusIcon = (status: Episode["status"]) => {
    switch (status) {
      case "planning":
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case "filming":
        return <Video className="w-4 h-4 text-blue-500" />;
      case "editing":
        return <Film className="w-4 h-4 text-purple-500" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusBadge = (status: Episode["status"]) => {
    const variants: Record<Episode["status"], string> = {
      planning: "bg-muted text-muted-foreground",
      filming: "bg-blue-500/10 text-blue-700 border-blue-500/20",
      editing: "bg-purple-500/10 text-purple-700 border-purple-500/20",
      delivered: "bg-green-500/10 text-green-700 border-green-500/20",
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Episode Planner</h1>
          <p className="text-muted-foreground">Plan multi-episode founder series</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="h-4 w-4" />
              New Episode
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEpisode ? "Edit Episode" : "Create New Episode"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Episode Number</Label>
                  <Input
                    type="number"
                    value={formData.episode_number}
                    onChange={(e) => setFormData({ ...formData, episode_number: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value: Episode["status"]) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="filming">Filming</SelectItem>
                      <SelectItem value="editing">Editing</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Episode Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., The Origin Story"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What happens in this episode?"
                  rows={3}
                />
              </div>

              <div>
                <Label>Story Arc</Label>
                <Textarea
                  value={formData.story_arc}
                  onChange={(e) => setFormData({ ...formData, story_arc: e.target.value })}
                  placeholder="Key narrative beats, emotional journey, etc."
                  rows={3}
                />
              </div>

              <div>
                <Label>Assign to Client (Optional)</Label>
                <Select 
                  value={formData.client_id} 
                  onValueChange={(val) => setFormData({ ...formData, client_id: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No client assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No client assigned</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name || `Client ${client.id.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Filming Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.filming_date ? format(formData.filming_date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.filming_date}
                        onSelect={(date) => setFormData({ ...formData, filming_date: date })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Delivery Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.delivery_date ? format(formData.delivery_date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.delivery_date}
                        onSelect={(date) => setFormData({ ...formData, delivery_date: date })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  placeholder="e.g., 15"
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional production notes..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEpisode}>
                  {editingEpisode ? "Update Episode" : "Create Episode"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Project Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.project_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Episodes List */}
      {selectedProject && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Episodes ({episodes.length})
          </h2>

          {episodes.length === 0 ? (
            <Card className="p-12 text-center">
              <PlayCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No episodes planned yet</p>
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Episode
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {episodes.map((episode) => (
                <Card key={episode.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary font-bold text-lg">
                          {episode.episode_number}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{episode.title}</h3>
                            {getStatusBadge(episode.status)}
                          </div>
                          {episode.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {episode.description}
                            </p>
                          )}
                          {episode.story_arc && (
                            <div className="bg-muted/50 p-3 rounded-lg mb-2">
                              <p className="text-xs font-medium mb-1">Story Arc:</p>
                              <p className="text-sm">{episode.story_arc}</p>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {episode.filming_date && (
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                Filming: {format(new Date(episode.filming_date), "MMM d, yyyy")}
                              </div>
                            )}
                            {episode.delivery_date && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Delivery: {format(new Date(episode.delivery_date), "MMM d, yyyy")}
                              </div>
                            )}
                            {episode.duration_minutes && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {episode.duration_minutes} min
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditEpisode(episode)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteEpisode(episode.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
