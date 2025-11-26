import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import railwayApi from "@/lib/railwayApi";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Upload } from "lucide-react";

export default function AdminDeliverableUpload() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deliverable, setDeliverable] = useState<any>(null);
  const [nextVersion, setNextVersion] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const deliverableData = await railwayApi.deliverables.getById(id);
      setDeliverable(deliverableData);

      // TODO: Add versions endpoint
      const allDeliverables = await railwayApi.deliverables.getAll();
      const versions = allDeliverables
        .filter(d => d.deliverable_id === id)
        .sort((a, b) => b.version_number - a.version_number);

      setNextVersion((versions?.[0]?.version_number || 0) + 1);
    } catch (error: any) {
      toast({
        title: "Error loading deliverable",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const filePath = `${deliverable.project_id}/${id}/v${nextVersion}-${file.name}`;
      // TODO: Implement R2 storage upload
      // await railwayApi.files.upload(file, { deliverable_id: id });

      // Determine status based on revision count
      const allDeliverables = await railwayApi.deliverables.getAll();
      const versions = allDeliverables.filter(d => d.deliverable_id === id);

      const revisionCount = versions?.length || 0;
      const status = revisionCount >= deliverable.max_revisions 
        ? "needs_change_order" 
        : "pending_review";

      // Create version record
      await railwayApi.deliverables.create({
        deliverable_id: id,
        version_number: nextVersion,
        file_name: file.name,
        file_size_bytes: file.size,
        file_path: filePath,
        storage_bucket: "project-deliverables",
        status: status,
        notes: notes || null,
      });

      toast({
        title: "Version uploaded",
        description: `Version ${nextVersion} has been uploaded successfully`,
      });

      navigate(`/admin/deliverables/${id}`);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/deliverables/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold">Upload New Version</h1>
          <p className="text-muted-foreground mt-1">
            {deliverable?.title} • {deliverable?.projects?.project_name}
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div className="bg-primary/10 text-primary font-bold px-4 py-3 rounded text-center text-lg">
              This will be Version {nextVersion}
            </div>

            <div>
              <Label htmlFor="file">File *</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept={deliverable?.deliverable_type === 'video' ? 'video/*' : 
                        deliverable?.deliverable_type === 'image' ? 'image/*' :
                        deliverable?.deliverable_type === 'audio' ? 'audio/*' : '*'}
              />
              {file && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this version (e.g., what changes were made)"
                rows={4}
              />
            </div>

            <Button 
              onClick={handleUpload} 
              disabled={!file || uploading} 
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Version {nextVersion}
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
