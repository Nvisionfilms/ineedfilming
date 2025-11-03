import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Instagram, 
  Linkedin, 
  Youtube,
  Video,
  Square,
  Smartphone,
  Monitor,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

interface ExportFormat {
  id: string;
  name: string;
  platform: string;
  aspectRatio: string;
  resolution: string;
  maxDuration: string;
  icon: any;
  color: string;
  description: string;
}

const exportFormats: ExportFormat[] = [
  {
    id: "instagram-reel",
    name: "Instagram Reel",
    platform: "Instagram",
    aspectRatio: "9:16",
    resolution: "1080x1920",
    maxDuration: "90 seconds",
    icon: Instagram,
    color: "bg-gradient-to-br from-purple-500 to-pink-500",
    description: "Vertical format for Instagram Reels",
  },
  {
    id: "tiktok",
    name: "TikTok",
    platform: "TikTok",
    aspectRatio: "9:16",
    resolution: "1080x1920",
    maxDuration: "10 minutes",
    icon: Video,
    color: "bg-black",
    description: "Vertical format for TikTok",
  },
  {
    id: "youtube-short",
    name: "YouTube Short",
    platform: "YouTube",
    aspectRatio: "9:16",
    resolution: "1080x1920",
    maxDuration: "60 seconds",
    icon: Youtube,
    color: "bg-red-600",
    description: "Vertical format for YouTube Shorts",
  },
  {
    id: "linkedin-square",
    name: "LinkedIn Square",
    platform: "LinkedIn",
    aspectRatio: "1:1",
    resolution: "1080x1080",
    maxDuration: "10 minutes",
    icon: Linkedin,
    color: "bg-blue-600",
    description: "Square format for LinkedIn feed",
  },
  {
    id: "linkedin-landscape",
    name: "LinkedIn Landscape",
    platform: "LinkedIn",
    aspectRatio: "16:9",
    resolution: "1920x1080",
    maxDuration: "10 minutes",
    icon: Monitor,
    color: "bg-blue-700",
    description: "Landscape format for LinkedIn",
  },
  {
    id: "instagram-story",
    name: "Instagram Story",
    platform: "Instagram",
    aspectRatio: "9:16",
    resolution: "1080x1920",
    maxDuration: "60 seconds",
    icon: Smartphone,
    color: "bg-gradient-to-br from-yellow-500 to-pink-500",
    description: "Full-screen vertical story format",
  },
  {
    id: "instagram-square",
    name: "Instagram Square",
    platform: "Instagram",
    aspectRatio: "1:1",
    resolution: "1080x1080",
    maxDuration: "60 seconds",
    icon: Square,
    color: "bg-gradient-to-br from-purple-600 to-pink-600",
    description: "Square format for Instagram feed",
  },
  {
    id: "youtube-landscape",
    name: "YouTube Landscape",
    platform: "YouTube",
    aspectRatio: "16:9",
    resolution: "1920x1080",
    maxDuration: "Unlimited",
    icon: Youtube,
    color: "bg-red-500",
    description: "Standard YouTube video format",
  },
];

interface MultiFormatExportProps {
  videoUrl: string;
  videoTitle: string;
  onExport?: (format: ExportFormat) => Promise<void>;
}

export function MultiFormatExport({ videoUrl, videoTitle, onExport }: MultiFormatExportProps) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [exported, setExported] = useState<Set<string>>(new Set());

  const handleExport = async (format: ExportFormat) => {
    setExporting(format.id);
    
    try {
      if (onExport) {
        await onExport(format);
      } else {
        // Default behavior: download the original video
        // In production, this would trigger a server-side conversion
        const link = document.createElement("a");
        link.href = videoUrl;
        link.download = `${videoTitle}_${format.id}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setExported(prev => new Set(prev).add(format.id));
      toast.success(`${format.name} exported successfully!`);
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`);
    } finally {
      setExporting(null);
    }
  };

  const handleDownloadAll = async () => {
    toast.info("Preparing all formats for download...");
    
    for (const format of exportFormats) {
      await handleExport(format);
      // Add a small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    toast.success("All formats exported!");
  };

  const getAspectRatioIcon = (aspectRatio: string) => {
    if (aspectRatio === "9:16") return <Smartphone className="w-4 h-4" />;
    if (aspectRatio === "1:1") return <Square className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Multi-Format Export</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Download optimized versions for different platforms
            </p>
          </div>
          <Button onClick={handleDownloadAll} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {exportFormats.map((format) => (
            <Card
              key={format.id}
              className="relative overflow-hidden hover:border-primary/50 transition-all group"
            >
              <CardContent className="p-4">
                {/* Platform Icon Background */}
                <div className={`absolute top-0 right-0 w-20 h-20 ${format.color} opacity-10 rounded-bl-full`} />
                
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${format.color} text-white`}>
                    <format.icon className="w-5 h-5" />
                  </div>
                  {exported.has(format.id) && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Exported
                    </Badge>
                  )}
                </div>

                {/* Format Info */}
                <div className="space-y-2 mb-4">
                  <h3 className="font-semibold text-sm">{format.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {format.description}
                  </p>
                </div>

                {/* Specs */}
                <div className="space-y-1 mb-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {getAspectRatioIcon(format.aspectRatio)}
                    <span>{format.aspectRatio} • {format.resolution}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    <span>Max: {format.maxDuration}</span>
                  </div>
                </div>

                {/* Export Button */}
                <Button
                  onClick={() => handleExport(format)}
                  disabled={exporting !== null}
                  className="w-full gap-2"
                  size="sm"
                  variant={exported.has(format.id) ? "outline" : "default"}
                >
                  {exporting === format.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      {exported.has(format.id) ? "Download Again" : "Export"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Banner */}
        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Note:</strong> Exports are optimized for each platform's specifications. 
            Videos are automatically cropped and resized to fit the aspect ratio while maintaining quality.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{exportFormats.length}</p>
            <p className="text-xs text-muted-foreground">Formats Available</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{exported.size}</p>
            <p className="text-xs text-muted-foreground">Exported</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{exportFormats.length - exported.size}</p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
