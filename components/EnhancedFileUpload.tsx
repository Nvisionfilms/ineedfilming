import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileIcon, Image as ImageIcon, Video as VideoIcon, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileWithPreview {
  file: File;
  preview?: string;
  progress: number;
  id: string;
}

interface EnhancedFileUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  acceptedTypes?: string;
  maxSize?: number; // in MB
  maxFiles?: number;
  category?: string;
}

export function EnhancedFileUpload({
  onUpload,
  acceptedTypes = "*",
  maxSize = 100,
  maxFiles = 10,
  category = "shared",
}: EnhancedFileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-8 h-8 text-blue-500" />;
    if (type.startsWith("video/")) return <VideoIcon className="w-8 h-8 text-purple-500" />;
    if (type.includes("pdf") || type.includes("document")) return <FileText className="w-8 h-8 text-red-500" />;
    return <FileIcon className="w-8 h-8 text-muted-foreground" />;
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`${file.name} is too large. Max size: ${maxSize}MB`);
      return false;
    }
    return true;
  };

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    if (files.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles = fileArray.filter(validateFile);
    
    const filesWithPreview: FileWithPreview[] = validFiles.map((file) => {
      const preview = file.type.startsWith("image/") 
        ? URL.createObjectURL(file)
        : undefined;
      
      return {
        file,
        preview,
        progress: 0,
        id: Math.random().toString(36).substring(7),
      };
    });

    setFiles((prev) => [...prev, ...filesWithPreview]);
  }, [files.length, maxFiles, maxSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    handleFiles(droppedFiles);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      await onUpload(files.map((f) => f.file));
      
      // Clear files after successful upload
      files.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
      setFiles([]);
      
      toast.success(`${files.length} file(s) uploaded successfully!`);
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragging && "border-primary bg-primary/5",
          !isDragging && "border-muted hover:border-primary/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Upload className={cn(
            "w-12 h-12 mb-4 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground"
          )} />
          <p className="text-lg font-medium mb-2">
            {isDragging ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse (max {maxSize}MB per file)
          </p>
          <input
            type="file"
            multiple
            accept={acceptedTypes}
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button variant="outline" asChild>
              <span>Browse Files</span>
            </Button>
          </label>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  {/* Preview/Icon */}
                  <div className="flex-shrink-0">
                    {fileItem.preview ? (
                      <img
                        src={fileItem.preview}
                        alt={fileItem.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      getFileIcon(fileItem.file.type)
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {fileItem.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(fileItem.file.size)}
                    </p>
                    {fileItem.progress > 0 && (
                      <Progress value={fileItem.progress} className="h-1 mt-2" />
                    )}
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(fileItem.id)}
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Upload Button */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {files.length} file(s) ready to upload
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    files.forEach((f) => {
                      if (f.preview) URL.revokeObjectURL(f.preview);
                    });
                    setFiles([]);
                  }}
                  disabled={isUploading}
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Upload Files"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
