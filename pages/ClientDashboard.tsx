import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, FolderOpen, MessageSquare, Upload, Download, Calendar, DollarSign, HardDrive, AlertCircle, Video } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StorageUpgradeDialog } from "@/components/StorageUpgradeDialog";
import { ClientNavigation } from "@/components/client/ClientNavigation";
import { ProjectProgressTracker } from "@/components/ProjectProgressTracker";
import { MeetingsCalendar } from "@/components/MeetingsCalendar";

interface ClientData {
  account: any;
  project: any;
  unreadMessages: number;
  meetings: any[];
  fileStats: {
    shared: number;
    private: number;
    deliverables: number;
  };
}

const ClientDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ClientData | null>(null);
  const [showStorageDialog, setShowStorageDialog] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchDashboardData();
    
    // Check for storage upgrade success/cancelled in URL
    const storageUpgrade = searchParams.get("storage_upgrade");
    if (storageUpgrade === "success") {
      toast.success("Storage upgrade successful! Your new storage limit will be available shortly.");
      // Remove the query param
      window.history.replaceState({}, "", "/client/dashboard");
    } else if (storageUpgrade === "cancelled") {
      toast.info("Storage upgrade cancelled");
      window.history.replaceState({}, "", "/client/dashboard");
    }
  }, [searchParams]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const [accountRes, messagesRes, filesRes, meetingsRes] = await Promise.all([
        supabase
          .from("client_accounts")
          .select("*, projects(*)")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("client_messages")
          .select("id")
          .eq("recipient_id", user.id)
          .eq("read", false),
        supabase
          .from("project_files")
          .select("category"),
        supabase
          .from("meetings")
          .select("*")
          .order("scheduled_at", { ascending: true })
      ]);

      if (accountRes.error) throw accountRes.error;

      const fileStats = {
        shared: filesRes.data?.filter(f => f.category === "shared").length || 0,
        private: filesRes.data?.filter(f => f.category === "private").length || 0,
        deliverables: filesRes.data?.filter(f => f.category === "deliverables").length || 0,
      };

      setData({
        account: accountRes.data,
        project: accountRes.data.projects,
        unreadMessages: messagesRes.data?.length || 0,
        meetings: meetingsRes.data || [],
        fileStats,
      });
    } catch (error: any) {
      toast.error(`Error loading dashboard: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientNavigation />
      
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Your Founder Story Dashboard</h1>
          <p className="text-muted-foreground">
            {data.account.company_name || "Your Company"}
          </p>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Hey there!</span> This is your command center for tracking your founder reality series. I'll keep you updated on every step of the journey. - Eric
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Your Series</CardTitle>
              <Video className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.project ? "1" : "0"}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.project?.project_name || "No series started yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.unreadMessages}</div>
              <p className="text-xs text-muted-foreground">Unread messages</p>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
              <HardDrive className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {((Number(data.account.storage_used_gb) / data.account.storage_limit_gb) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {Number(data.account.storage_used_gb).toFixed(2)} / {data.account.storage_limit_gb} GB
                </div>
              </div>
              
              <Progress 
                value={(Number(data.account.storage_used_gb) / data.account.storage_limit_gb) * 100}
                className={`h-2 ${
                  (Number(data.account.storage_used_gb) / data.account.storage_limit_gb) >= 0.95
                    ? "bg-destructive/20"
                    : (Number(data.account.storage_used_gb) / data.account.storage_limit_gb) >= 0.8
                    ? "bg-yellow-500/20"
                    : "bg-muted"
                }`}
              />
              
              {(Number(data.account.storage_used_gb) / data.account.storage_limit_gb) >= 0.8 && (
                <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                  <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-yellow-600">
                      {(Number(data.account.storage_used_gb) / data.account.storage_limit_gb) >= 0.95
                        ? "Storage almost full!"
                        : "Storage running low"}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="shrink-0"
                    onClick={() => setShowStorageDialog(true)}
                  >
                    Upgrade
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Episodes Ready</CardTitle>
              <Video className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.fileStats.deliverables}</div>
              <p className="text-xs text-muted-foreground">Files ready</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => navigate("/client/messages")}
            >
              <MessageSquare className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Message Eric</div>
                <div className="text-xs text-muted-foreground">Ask questions, share ideas</div>
              </div>
              {data.unreadMessages > 0 && (
                <Badge className="ml-auto">{data.unreadMessages}</Badge>
              )}
            </Button>

            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => navigate("/client/files")}
            >
              <FolderOpen className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Upload Files</div>
                <div className="text-xs text-muted-foreground">Share assets & footage</div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => navigate("/client/deliverables")}
            >
              <Video className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Watch Episodes</div>
                <div className="text-xs text-muted-foreground">View your founder story</div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => setShowStorageDialog(true)}
            >
              <HardDrive className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Upgrade Storage</div>
                <div className="text-xs text-muted-foreground">Add more space</div>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Storage Upgrade Dialog */}
        <StorageUpgradeDialog
          open={showStorageDialog}
          onOpenChange={setShowStorageDialog}
          currentLimit={data.account.storage_limit_gb}
          currentUsage={Number(data.account.storage_used_gb)}
        />

        {/* Project Progress Tracker */}
        {data.project && (
          <ProjectProgressTracker
            currentPhase={data.project.status || "pre-production"}
            projectName={data.project.project_name}
          />
        )}

        {/* Upcoming Meetings */}
        {data.meetings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Meetings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.meetings.filter(m => m.status === "scheduled" && new Date(m.scheduled_at) > new Date()).slice(0, 3).map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{meeting.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(meeting.scheduled_at), "MMM d, yyyy 'at' h:mm a")} • {meeting.duration_minutes} min
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => window.open(meeting.meeting_link, "_blank")}
                  >
                    Join
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Meetings Calendar */}
        <MeetingsCalendar userRole="client" clientId={data?.account?.id} />
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
