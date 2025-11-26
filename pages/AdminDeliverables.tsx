import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Upload, Eye, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface Deliverable {
  id: string;
  title: string;
  description: string;
  deliverable_type: string;
  specs: any;
  max_revisions: number;
  created_at: string;
  project_id: string;
  projects: {
    project_name: string;
  };
  latest_version?: {
    version_number: number;
    status: string;
    uploaded_at: string;
  };
}

export default function AdminDeliverables() {
  const [loading, setLoading] = useState(true);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    project_id: "",
    title: "",
    description: "",
    deliverable_type: "video",
    max_revisions: "2"
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, project_name")
        .order("project_name");

      setProjects(projectsData || []);

      const { data: deliverablesData, error } = await supabase
        .from("deliverables")
        .select(`
          *,
          projects (project_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get latest version for each deliverable
      const deliverablesWithVersions = await Promise.all(
        (deliverablesData || []).map(async (deliverable) => {
          const { data: versions } = await supabase
            .from("deliverable_versions")
            .select("version_number, status, uploaded_at")
            .eq("deliverable_id", deliverable.id)
            .order("version_number", { ascending: false })
            .limit(1);

          return {
            ...deliverable,
            latest_version: versions?.[0]
          };
        })
      );

      setDeliverables(deliverablesWithVersions);
    } catch (error: any) {
      toast({
        title: "Error loading deliverables",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.project_id || !formData.title) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: user, error: authError } = await api.getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("deliverables").insert({
        project_id: formData.project_id,
        title: formData.title,
        description: formData.description,
        deliverable_type: formData.deliverable_type,
        max_revisions: parseInt(formData.max_revisions),
        created_by: user.id
      });

      if (error) throw error;

      toast({
        title: "Deliverable created",
        description: "You can now upload the first version",
      });

      setCreateDialogOpen(false);
      setFormData({
        project_id: "",
        title: "",
        description: "",
        deliverable_type: "video",
        max_revisions: "2"
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error creating deliverable",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending_review: { variant: "secondary", icon: Clock, label: "Pending Review" },
      approved: { variant: "default", icon: CheckCircle, label: "Approved" },
      changes_requested: { variant: "destructive", icon: AlertCircle, label: "Changes Requested" },
      needs_change_order: { variant: "outline", icon: AlertCircle, label: "Needs Change Order" },
    };
    const config = variants[status] || variants.pending_review;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Deliverables</h1>
              <p className="text-muted-foreground mt-1">
                Manage project deliverables with version control
              </p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Deliverable
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Deliverable</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="project">Project *</Label>
                    <Select
                      value={formData.project_id}
                      onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border z-50">
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.project_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Main Brand Video"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the deliverable"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.deliverable_type}
                      onValueChange={(value) => setFormData({ ...formData, deliverable_type: value })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border z-50">
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_revisions">Max Revisions Before Change Order</Label>
                    <Input
                      id="max_revisions"
                      type="number"
                      min="1"
                      value={formData.max_revisions}
                      onChange={(e) => setFormData({ ...formData, max_revisions: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleCreate} className="w-full">
                    Create Deliverable
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {deliverables.length === 0 ? (
              <Card>
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center mb-4">No deliverables yet</p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Deliverable
                  </Button>
                </div>
              </Card>
            ) : (
              deliverables.map((deliverable) => (
                <Card key={deliverable.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold">{deliverable.title}</h3>
                        <Badge variant="outline">{deliverable.deliverable_type}</Badge>
                        {deliverable.latest_version && getStatusBadge(deliverable.latest_version.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {deliverable.projects?.project_name}
                      </p>
                      {deliverable.description && (
                        <p className="text-sm text-muted-foreground mb-2">{deliverable.description}</p>
                      )}
                      {deliverable.latest_version && (
                        <p className="text-xs text-muted-foreground">
                          Current Version: V{deliverable.latest_version.version_number} • 
                          Max {deliverable.max_revisions} revisions included
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/deliverables/${deliverable.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/admin/deliverables/${deliverable.id}/upload`)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
