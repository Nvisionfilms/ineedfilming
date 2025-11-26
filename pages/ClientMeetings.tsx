import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientNavigation } from "@/components/client/ClientNavigation";
import { Calendar, Clock, Video, Loader2, ExternalLink } from "lucide-react";
import { format, isPast, isFuture } from "date-fns";
import { toast } from "sonner";

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string;
  status: string;
  created_at: string;
}

const ClientMeetings = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('client-meetings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meetings'
        },
        () => {
          console.log('Meeting change detected, reloading...');
          fetchMeetings();
        }
      )
      .subscribe();

    return () => {
      // Real-time removed - can add WebSocket later
    };
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);

      const { data: user, error: authError } = await api.getCurrentUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get client account and associated booking
      const { data: account, error: accountError } = await supabase
        .from("client_accounts")
        .select("id, booking_id, project_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (accountError || !account) {
        console.error("Error fetching client account:", accountError);
        setLoading(false);
        return;
      }

      // Build query to get all meetings related to this client
      // This includes meetings linked to:
      // 1. Their client_id directly
      // 2. Their booking_id
      // 3. Their project_id
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .or(`client_id.eq.${account.id},booking_id.eq.${account.booking_id || 'null'},project_id.eq.${account.project_id || 'null'}`)
        .order("scheduled_at", { ascending: true });

      if (error) {
        console.error("Error fetching meetings:", error);
        toast.error("Failed to load meetings");
      } else {
        setMeetings(data || []);
      }
    } catch (error) {
      console.error("Error in fetchMeetings:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const upcomingMeetings = meetings.filter(m => isFuture(new Date(m.scheduled_at)));
  const pastMeetings = meetings.filter(m => isPast(new Date(m.scheduled_at)));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ClientNavigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ClientNavigation />
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Meetings</h1>
          <p className="text-muted-foreground mt-1">View your scheduled meetings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{meetings.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingMeetings.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Past</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pastMeetings.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Meetings */}
        {upcomingMeetings.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Upcoming Meetings</h2>
            <div className="grid gap-4">
              {upcomingMeetings.map((meeting) => {
                const meetingDate = new Date(meeting.scheduled_at);
                return (
                  <Card key={meeting.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg">{meeting.title}</CardTitle>
                          {meeting.description && (
                            <p className="text-sm text-muted-foreground">{meeting.description}</p>
                          )}
                        </div>
                        <Badge variant="default">{meeting.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{format(meetingDate, "PPP")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{format(meetingDate, "p")} ({meeting.duration_minutes} min)</span>
                        </div>
                      </div>
                      {meeting.meeting_link && (
                        <div className="pt-3 border-t">
                          <Button
                            className="w-full"
                            onClick={() => window.open(meeting.meeting_link, "_blank")}
                          >
                            <Video className="w-4 h-4 mr-2" />
                            Join Meeting
                            <ExternalLink className="w-3 h-3 ml-2" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Past Meetings */}
        {pastMeetings.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Past Meetings</h2>
            <div className="grid gap-4">
              {pastMeetings.map((meeting) => {
                const meetingDate = new Date(meeting.scheduled_at);
                return (
                  <Card key={meeting.id} className="opacity-75">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg">{meeting.title}</CardTitle>
                          {meeting.description && (
                            <p className="text-sm text-muted-foreground">{meeting.description}</p>
                          )}
                        </div>
                        <Badge variant="secondary">Completed</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{format(meetingDate, "PPP")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{format(meetingDate, "p")} ({meeting.duration_minutes} min)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {meetings.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">No meetings scheduled yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClientMeetings;
