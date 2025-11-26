import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Upload, 
  File, 
  Download, 
  Trash2, 
  Loader2, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  FileIcon 
} from "lucide-react";
import { ClientNavigation } from "@/components/client/ClientNavigation";
import { EnhancedFileUpload } from "@/components/EnhancedFileUpload";

interface ProjectFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  file_type: string;
  category: string;
  description: string | null;
  created_at: string;
  uploaded_by: string;
}

const ClientFiles = () => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"shared" | "private">("shared");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState("");

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data: user, error: authError } = await api.getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const { data: accountData } = await supabase
        .from("client_accounts")
        .select("project_id")
        .eq("user_id", user.id)
        .single();

      if (!accountData?.project_id) {
        toast.error("No project assigned to your account");
        return;
      }

      setProjectId(accountData.project_id);

      const { data: filesData, error } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", accountData.project_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFiles(filesData || []);
    } catch (error: any) {
      toast.error(`Error loading files: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !projectId) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    try {
      const { data: user, error: authError } = await api.getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      // Check storage limit before upload
      const { data: accountData, error: accountError } = await supabase
        .from("client_accounts")
        .select("storage_used_gb, storage_limit_gb")
        .eq("user_id", user.id)
        .single();

      if (accountError) throw accountError;

      const fileSizeGB = uploadFile.size / (1024 * 1024 * 1024);
      const newUsage = Number(accountData.storage_used_gb) + fileSizeGB;

      if (newUsage > accountData.storage_limit_gb) {
        const remaining = accountData.storage_limit_gb - Number(accountData.storage_used_gb);
        toast.error(
          `Storage limit exceeded! You have ${remaining.toFixed(2)}GB remaining. Please upgrade your storage to upload this file.`,
          { duration: 5000 }
        );
        return;
      }

      const bucket = selectedCategory === "shared" ? "project-shared-files" : "project-private-files";
      const filePath = `${projectId}/${user.id}/${Date.now()}_${uploadFile.name}`;

      const { error: uploadError } = // TODO: Replace with R2 storage - supabase.storage
        .from(bucket)
        .upload(filePath, uploadFile);

      if (uploadError) throw uploadError;

      const { error: dbError } = await api.request("/api/files", { method: "POST", body: JSON.stringify({
        project_id: projectId,
        uploaded_by: user.id,
        file_name: uploadFile.name,
        file_path: `${bucket}/${filePath}`,
        file_size_bytes: uploadFile.size,
        file_type: uploadFile.type.split("/")[0],
        mime_type: uploadFile.type,
        category: selectedCategory,
        description: uploadDescription || null,
      }) });

      if (dbError) throw dbError;

      // Update storage usage
      const { error: updateError } = await supabase
        .from("client_accounts")
        .update({ storage_used_gb: newUsage })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Failed to update storage usage:", updateError);
      }

      toast.success("File uploaded successfully");
      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadDescription("");
      fetchFiles();
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: ProjectFile) => {
    try {
      const [bucket, ...pathParts] = file.file_path.split("/");
      const path = pathParts.join("/");

      const { data, error } = // TODO: Replace with R2 storage - supabase.storage
        .from(bucket)
        .download(path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.file_name;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Download started");
    } catch (error: any) {
      toast.error(`Download failed: ${error.message}`);
    }
  };

  const handleDelete = async (file: ProjectFile) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const [bucket, ...pathParts] = file.file_path.split("/");
      const path = pathParts.join("/");

      const { error: storageError } = // TODO: Replace with R2 storage - supabase.storage
        .from(bucket)
        .remove([path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("project_files")
        .delete()
        .eq("id", file.id);

      if (dbError) throw dbError;

      toast.success("File deleted");
      fetchFiles();
    } catch (error: any) {
      toast.error(`Delete failed: ${error.message}`);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "image": return <ImageIcon className="w-4 h-4" />;
      case "video": return <Video className="w-4 h-4" />;
      case "application": return <FileText className="w-4 h-4" />;
      default: return <FileIcon className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const filterFiles = (category: string) => files.filter(f => f.category === category);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientNavigation />
      
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Files</h1>
            <p className="text-muted-foreground mt-1">Manage your project documents</p>
          </div>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload File</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Tabs value={selectedCategory} onValueChange={(v: any) => setSelectedCategory(v)}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="shared">Shared Files</TabsTrigger>
                      <TabsTrigger value="private">Private Files</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Brief description of the file"
                  />
                </div>
                <Button onClick={handleUpload} disabled={uploading || !uploadFile} className="w-full">
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="shared" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="shared">
              Shared Files
              <Badge variant="secondary" className="ml-2">
                {filterFiles("shared").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="private">
              Private Files
              <Badge variant="secondary" className="ml-2">
                {filterFiles("private").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="deliverables">
              Deliverables
              <Badge variant="secondary" className="ml-2">
                {filterFiles("deliverables").length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {["shared", "private", "deliverables"].map((category) => (
            <TabsContent key={category} value={category} className="mt-6">
              <div className="grid gap-4">
                {filterFiles(category).length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <File className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">
                        No files in {category} yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filterFiles(category).map((file) => (
                    <Card key={file.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {getFileIcon(file.file_type)}
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-base truncate">{file.file_name}</CardTitle>
                              {file.description && (
                                <p className="text-sm text-muted-foreground mt-1">{file.description}</p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline">{file.file_type}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatFileSize(file.file_size_bytes)}</span>
                            <span>{new Date(file.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(file)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            {category !== "deliverables" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(file)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ClientFiles;
