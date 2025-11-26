import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Download, Upload, MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Version {
  id: string;
  version_number: number;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  file_type: string;
  mime_type: string | null;
  storage_bucket: string;
  status: string;
  uploaded_at: string;
  approved_at: string | null;
  approved_by: string | null;
  notes: string | null;
  deliverable_feedback: Array<{
    user_id: string;
    feedback_type: string;
    message: string;
    timecode: string | null;
    created_at: string;
    profiles: {
      full_name: string;
      email: string;
    };
  }>;
}

export default function AdminDeliverableVersions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [deliverable, setDeliverable] = useState<any>(null);
  const [versions, setVersions] = useState<Version[]>([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const { data: deliverableData, error: deliverableError } = await supabase
        .from("deliverables")
        .select(`
          *,
          projects (project_name)
        `)
        .eq("id", id)
        .single();

      if (deliverableError) throw deliverableError;
      setDeliverable(deliverableData);

      const { data: versionsData, error: versionsError } = await supabase
        .from("deliverable_versions")
        .select(`
          *
        `)
        .eq("deliverable_id", id)
        .order("version_number", { ascending: false });

      if (versionsError) throw versionsError;

      // Fetch feedback separately for each version
      const versionsWithFeedback = await Promise.all(
        (versionsData || []).map(async (version) => {
          const { data: feedback } = await supabase
            .from("deliverable_feedback")
            .select(`
              user_id,
              feedback_type,
              message,
              timecode,
              created_at
            `)
            .eq("version_id", version.id)
            .order("created_at", { ascending: false });

          // Get profile info for each feedback
          const feedbackWithProfiles = await Promise.all(
            (feedback || []).map(async (fb) => {
              const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, email")
                .eq("id", fb.user_id)
                .single();

              return {
                ...fb,
                profiles: profile || { full_name: "", email: "" }
              };
            })
          );

          return {
            ...version,
            deliverable_feedback: feedbackWithProfiles
          };
        })
      );

      setVersions(versionsWithFeedback);
    } catch (error: any) {
      toast({
        title: "Error loading versions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (version: Version) => {
    try {
      const { data, error } = /* TODO: R2 storage */ null as any // supabase.storage
        .from(version.storage_bucket)
        .download(version.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = version.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/deliverables")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {deliverable && (
          <div>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">{deliverable.title}</h1>
                <p className="text-muted-foreground mt-1">
                  {deliverable.projects?.project_name}
                </p>
                {deliverable.description && (
                  <p className="text-sm text-muted-foreground mt-2">{deliverable.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Max {deliverable.max_revisions} revisions included • After that, change order required
                </p>
              </div>
              <Button onClick={() => navigate(`/admin/deliverables/${id}/upload`)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload New Version
              </Button>
            </div>

            {versions.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground mb-4">No versions uploaded yet</p>
                <Button onClick={() => navigate(`/admin/deliverables/${id}/upload`)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Version
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {versions.map((version) => (
                  <Card key={version.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary font-bold px-3 py-1 rounded">
                          V{version.version_number}
                        </div>
                        {getStatusBadge(version.status)}
                        {version.status === 'needs_change_order' && (
                          <Badge variant="destructive">Change Order Required</Badge>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(version)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm">
                        <span className="font-medium">File:</span> {version.file_name}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Size:</span> {formatFileSize(version.file_size_bytes)}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Uploaded:</span>{" "}
                        {format(new Date(version.uploaded_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                      {version.approved_at && (
                        <p className="text-sm">
                          <span className="font-medium">Approved:</span>{" "}
                          {format(new Date(version.approved_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      )}
                      {version.notes && (
                        <p className="text-sm">
                          <span className="font-medium">Notes:</span> {version.notes}
                        </p>
                      )}
                    </div>

                    {version.deliverable_feedback && version.deliverable_feedback.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="h-4 w-4" />
                          <h4 className="font-medium">Feedback ({version.deliverable_feedback.length})</h4>
                        </div>
                        <div className="space-y-3">
                          {version.deliverable_feedback.map((fb: any, idx: number) => (
                            <div key={idx} className="bg-muted p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{fb.profiles?.full_name || fb.profiles?.email}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {fb.feedback_type}
                                  </Badge>
                                  {fb.timecode && (
                                    <Badge variant="secondary" className="text-xs">
                                      {fb.timecode}
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(fb.created_at), "MMM d, h:mm a")}
                                </span>
                              </div>
                              <p className="text-sm">{fb.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
