import { useEffect, useState, useRef } from "react";
import railwayApi from "@/lib/railwayApi";
import { ClientNavigation } from "@/components/client/ClientNavigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, CheckCircle, MessageSquare, Clock, AlertCircle, Play } from "lucide-react";
import { format } from "date-fns";
import { VideoPlayer } from "@/components/VideoPlayer";
import { MultiFormatExport } from "@/components/MultiFormatExport";

interface Version {
  id: string;
  version_number: number;
  file_name: string;
  file_size_bytes: number;
  file_path: string;
  storage_bucket: string;
  status: string;
  uploaded_at: string;
  approved_at: string | null;
  notes: string | null;
}

interface Deliverable {
  id: string;
  title: string;
  description: string;
  deliverable_type: string;
  max_revisions: number;
  versions: Version[];
}

export default function ClientDeliverables() {
  const [loading, setLoading] = useState(true);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [feedbackDialog, setFeedbackDialog] = useState<{ open: boolean; versionId: string; versionNumber: number }>({
    open: false,
    versionId: "",
    versionNumber: 0
  });
  const [feedbackForm, setFeedbackForm] = useState({
    type: "revision_request",
    message: "",
    timecode: ""
  });
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadDeliverables();
  }, []);

  const loadDeliverables = async () => {
    try {
      const { data: user, error: authError } = await railwayApi.getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const clients = await railwayApi.clients.getAll();
      const clientAccount = clients.find(c => c.user_id === user.id);

      if (!clientAccount?.project_id) {
        setDeliverables([]);
        setLoading(false);
        return;
      }

      const deliverablesData = await railwayApi.deliverables.getByProjectId(clientAccount.project_id);

      const deliverablesWithVersions = await Promise.all(
        (deliverablesData || []).map(async (deliverable) => {
          const allVersions = await railwayApi.deliverables.getAll();
          const versions = allVersions.filter(v => v.deliverable_id === deliverable.id)
            .sort((a, b) => b.version_number - a.version_number);

          return { ...deliverable, versions: versions || [] };
        })
      );

      setDeliverables(deliverablesWithVersions);

      const urls: Record<string, string> = {};
      for (const deliverable of deliverablesWithVersions) {
        for (const version of deliverable.versions) {
          if (isVideoFile(version.file_name)) {
            urls[version.id] = version.file_path || '';
          }
        }
      }
      setVideoUrls(urls);
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

  const handleApprove = async (versionId: string, deliverableId: string) => {
    try {
      const { data: user, error: authError } = await railwayApi.getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      await railwayApi.deliverables.update(versionId, {
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      });

      toast({
        title: "Version approved",
        description: "The team has been notified of your approval",
      });

      loadDeliverables();
    } catch (error: any) {
      toast({
        title: "Error approving version",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackForm.message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter your feedback",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: user, error: authError } = await railwayApi.getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      if (feedbackForm.type === "revision_request") {
        await railwayApi.deliverables.update(feedbackDialog.versionId, { 
          status: "changes_requested" 
        });
      }

      toast({
        title: "Feedback submitted",
        description: "The team will review your feedback",
      });

      setFeedbackDialog({ open: false, versionId: "", versionNumber: 0 });
      setFeedbackForm({ type: "revision_request", message: "", timecode: "" });
      loadDeliverables();
    } catch (error: any) {
      toast({
        title: "Error submitting feedback",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (version: Version) => {
    try {
      // TODO: Implement R2 storage download
      // For now, open the file path directly
      if (version.file_path) {
        window.open(version.file_path, '_blank');
        return;
      }
      throw new Error('File path not available');
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

  const isVideoFile = (filename: string) => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
    return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const captureTimestamp = (versionId: string) => {
    const videoEl = videoRefs.current[versionId];
    if (videoEl) {
      const currentTime = videoEl.currentTime;
      const hours = Math.floor(currentTime / 3600);
      const minutes = Math.floor((currentTime % 3600) / 60);
      const seconds = Math.floor(currentTime % 60);
      const timestamp = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setFeedbackForm({ ...feedbackForm, timecode: timestamp });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending_review: { variant: "secondary", icon: Clock, label: "Awaiting Your Review" },
      approved: { variant: "default", icon: CheckCircle, label: "Approved" },
      changes_requested: { variant: "destructive", icon: AlertCircle, label: "Revisions Requested" },
      needs_change_order: { variant: "outline", icon: AlertCircle, label: "Additional Revisions" },
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
      <div className="min-h-screen bg-background">
        <ClientNavigation />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientNavigation />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Your Episodes</h1>
          <p className="text-muted-foreground mt-1">
            Watch, download, and approve your founder story episodes
          </p>
        </div>

        {deliverables.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No deliverables available yet</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {deliverables.map((deliverable) => (
              <Card key={deliverable.id} className="p-6">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{deliverable.title}</h2>
                    <Badge variant="outline">{deliverable.deliverable_type}</Badge>
                  </div>
                  {deliverable.description && (
                    <p className="text-muted-foreground">{deliverable.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {deliverable.max_revisions} revisions included
                  </p>
                </div>

                {deliverable.versions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No versions uploaded yet</p>
                ) : (
                  <div className="space-y-4">
                    {deliverable.versions.map((version) => (
                      <div key={version.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 text-primary font-bold px-3 py-1 rounded">
                              V{version.version_number}
                            </div>
                            {getStatusBadge(version.status)}
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleDownload(version)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>

                        {isVideoFile(version.file_name) && videoUrls[version.id] && (
                          <div className="space-y-4 mb-4">
                            <VideoPlayer
                              src={videoUrls[version.id]}
                              title={`${deliverable.title} - Version ${version.version_number}`}
                              showTimestampButton={version.status === "pending_review"}
                              onTimestampCapture={(timestamp) => {
                                setFeedbackForm({ ...feedbackForm, timecode: timestamp });
                                setFeedbackDialog({ 
                                  open: true, 
                                  versionId: version.id,
                                  versionNumber: version.version_number 
                                });
                              }}
                              onFeedback={() => {
                                setFeedbackDialog({ 
                                  open: true, 
                                  versionId: version.id,
                                  versionNumber: version.version_number 
                                });
                              }}
                            />
                            
                            {/* Multi-Format Export */}
                            {version.status === "approved" && (
                              <MultiFormatExport
                                videoUrl={videoUrls[version.id]}
                                videoTitle={`${deliverable.title}_v${version.version_number}`}
                              />
                            )}
                          </div>
                        )}

                        <div className="space-y-1 mb-4 text-sm">
                          <p><span className="font-medium">File:</span> {version.file_name}</p>
                          <p><span className="font-medium">Size:</span> {formatFileSize(version.file_size_bytes)}</p>
                          <p><span className="font-medium">Uploaded:</span> {format(new Date(version.uploaded_at), "MMM d, yyyy 'at' h:mm a")}</p>
                          {version.notes && <p><span className="font-medium">Notes:</span> {version.notes}</p>}
                        </div>

                        {version.status === "pending_review" && (
                          <div className="flex gap-2">
                            <Button onClick={() => handleApprove(version.id, deliverable.id)} className="flex-1">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve This Version
                            </Button>
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => setFeedbackDialog({ 
                                open: true, 
                                versionId: version.id,
                                versionNumber: version.version_number 
                              })}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Request Changes
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        <Dialog open={feedbackDialog.open} onOpenChange={(open) => setFeedbackDialog({ ...feedbackDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Provide Feedback - V{feedbackDialog.versionNumber}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Timecode (Optional)</Label>
                <Input
                  placeholder="e.g., 00:02:30"
                  value={feedbackForm.timecode}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, timecode: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  For video feedback, specify where changes are needed
                </p>
              </div>
              <div>
                <Label>Your Feedback *</Label>
                <Textarea
                  placeholder="Describe what changes you'd like to see..."
                  value={feedbackForm.message}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                  rows={6}
                />
              </div>
              <Button onClick={handleSubmitFeedback} className="w-full">
                Submit Feedback
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
