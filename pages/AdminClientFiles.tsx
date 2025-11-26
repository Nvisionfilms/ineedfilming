import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  FileIcon,
  ArrowLeft,
  Folder,
  Eye
} from "lucide-react";

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

interface ClientAccount {
  id: string;
  user_id: string;
  project_id: string | null;
  company_name: string | null;
  profiles?: { email: string; full_name: string | null };
}

const AdminClientFiles = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [client, setClient] = useState<ClientAccount | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadCategory, setUploadCategory] = useState<"shared" | "private" | "deliverables">("shared");
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    if (clientId) {
      fetchClientAndFiles();
    }
  }, [clientId]);

  const fetchClientAndFiles = async () => {
    try {
      setLoading(true);

      // Fetch client info
      const { data: clients, error: clientError } = await api.getClients();
      if (clientError) throw new Error(clientError);
      
      const clientData = clients?.find((c: any) => c.id === clientId);
      
      if (!clientData) {
        toast.error("Client not found");
        return;
      }

      if (!clientData.project_id) {
        toast.error("No project assigned to this client");
      }

      // Fetch user profile for email/name
      const { data: user } = await api.getCurrentUser();
      const profileData = user?.id === clientData.user_id ? 
        { email: user.email, full_name: user.full_name } : undefined;

      setClient({
        ...clientData,
        profiles: profileData,
      });

      // Fetch files for the client's project if they have one
      if (clientData.project_id) {
        const { data: filesData, error: filesError } = await api.getFiles(clientData.project_id);
        if (filesError) throw new Error(filesError);
        
        const sortedFiles = (filesData || []).sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setFiles(sortedFiles);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast.error(`Error loading data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !client?.project_id) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    try {
      const { data: user, error: authError } = await api.getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const bucket = uploadCategory === "deliverables" ? "project-deliverables" : 
                     uploadCategory === "private" ? "project-private-files" : "project-shared-files";
      const filePath = `${client.project_id}/${Date.now()}_${uploadFile.name}`;

      // TODO: Implement R2 storage upload
      const uploadError = new Error('R2 storage not implemented yet');

      if (uploadError) throw uploadError;

      const { error: dbError } = await api.request("/api/files", { method: "POST", body: JSON.stringify({
        project_id: client.project_id,
        uploaded_by: user.id,
        file_name: uploadFile.name,
        file_path: `${bucket}/${filePath}`,
        file_size_bytes: uploadFile.size,
        file_type: uploadFile.type.split("/")[0],
        mime_type: uploadFile.type,
        category: uploadCategory,
        description: uploadDescription || null,
      }) });

      if (dbError) throw dbError;

      toast.success(`File uploaded successfully to ${uploadCategory === "deliverables" ? "deliverables" : "shared files"}`);
      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadDescription("");
      setUploadCategory("shared");
      fetchClientAndFiles();
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

      // TODO: Implement R2 storage download
      const data = null;
      const error = new Error('R2 storage not implemented yet');

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

      // TODO: Implement R2 storage delete
      const storageError = null; // Skip for now

      if (storageError) throw storageError;

      // Delete from Railway API
      const response = await api.request(`/api/files/${file.id}`, { method: 'DELETE' });
      if (response.error) throw new Error(response.error);

      toast.success("File deleted");
      fetchClientAndFiles();
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

  const handlePreview = async (file: ProjectFile) => {
    if (file.file_type !== "video") return;
    
    try {
      const [bucket, ...pathParts] = file.file_path.split("/");
      const path = pathParts.join("/");

      // TODO: Implement R2 storage signed URLs
      const data = { signedUrl: file.file_path };
      const error = null; // 1 hour expiry

      if (error) throw error;
      
      setPreviewUrl(data.signedUrl);
      setPreviewFile(file);
    } catch (error: any) {
      toast.error(`Preview failed: ${error.message}`);
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewUrl("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Unable to load client information</p>
          <Button onClick={() => navigate("/admin/clients")}>
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  const clientName = client.profiles?.full_name || client.profiles?.email || client.company_name || "Unknown Client";

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/clients")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">Client Files</h1>
          <p className="text-muted-foreground mt-1">
            {clientName}
            {!client.project_id && " - No project assigned"}
          </p>
        </div>
        
        {client.project_id && (
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
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as "shared" | "private" | "deliverables")}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="shared">Shared Files</option>
                    <option value="private">Private Files</option>
                    <option value="deliverables">Final Deliverables</option>
                  </select>
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
        )}
      </div>

      {!client.project_id ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No project assigned to this client yet. Assign a project to manage files.
            </p>
          </CardContent>
        </Card>
      ) : (
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
                      No {category} files yet.
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
                           {file.file_type === "video" && (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => handlePreview(file)}
                             >
                               <Eye className="w-4 h-4" />
                             </Button>
                           )}
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleDownload(file)}
                           >
                             <Download className="w-4 h-4" />
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleDelete(file)}
                           >
                             <Trash2 className="w-4 h-4" />
                           </Button>
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
      )}

      {/* Video Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.file_name}</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="relative w-full" style={{ maxHeight: '720px' }}>
              <video
                controls
                className="w-full h-auto rounded-lg"
                style={{ maxHeight: '720px' }}
                src={previewUrl}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClientFiles;
