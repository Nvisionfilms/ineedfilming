import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, isSameDay } from "date-fns";
import { Clock, Video, User } from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  scheduled_date: string;
  duration_minutes: number;
  meeting_link: string | null;
  status: string;
  description: string | null;
  booking_id: string | null;
  client_id: string | null;
  custom_booking_requests?: {
    client_name: string;
    client_email: string;
  };
  client_accounts?: {
    full_name: string;
    email: string;
  };
}

interface MeetingsCalendarProps {
  userRole?: "admin" | "client";
  clientId?: string;
}

export const MeetingsCalendar = ({ userRole = "admin", clientId }: MeetingsCalendarProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedDayMeetings, setSelectedDayMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, [clientId]);

  useEffect(() => {
    if (date && meetings.length > 0) {
      const dayMeetings = meetings.filter(meeting => 
        isSameDay(new Date(meeting.scheduled_date), date)
      );
      setSelectedDayMeetings(dayMeetings);
    } else {
      setSelectedDayMeetings([]);
    }
  }, [date, meetings]);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('meetings')
        .select(`
          *,
          custom_booking_requests (
            client_name,
            client_email
          )
        `)
        .eq('status', 'scheduled')
        .order('scheduled_date', { ascending: true });

      // If client role, filter by client_id
      if (userRole === 'client' && clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error loading meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get dates that have meetings for highlighting
  const meetingDates = meetings.map(m => new Date(m.scheduled_date));

  const getClientName = (meeting: Meeting) => {
    if (meeting.custom_booking_requests) {
      return meeting.custom_booking_requests.client_name;
    }
    return "Client";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Meeting Calendar</CardTitle>
          <CardDescription>
            {userRole === 'admin' 
              ? 'View all scheduled meetings' 
              : 'View your scheduled meetings'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
            modifiers={{
              meeting: meetingDates,
            }}
            modifiersStyles={{
              meeting: {
                fontWeight: 'bold',
                textDecoration: 'underline',
                color: '#667eea',
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Selected Day Meetings */}
      <Card>
        <CardHeader>
          <CardTitle>
            {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
          </CardTitle>
          <CardDescription>
            {selectedDayMeetings.length === 0 
              ? 'No meetings scheduled for this day'
              : `${selectedDayMeetings.length} meeting${selectedDayMeetings.length > 1 ? 's' : ''} scheduled`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading meetings...
            </div>
          ) : selectedDayMeetings.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No meetings on this day
            </div>
          ) : (
            selectedDayMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{meeting.title}</h4>
                    {userRole === 'admin' && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <User className="w-4 h-4" />
                        {getClientName(meeting)}
                      </div>
                    )}
                  </div>
                  <Badge className={getStatusColor(meeting.status)}>
                    {meeting.status}
                  </Badge>
                </div>

                {meeting.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {meeting.description}
                  </p>
                )}

                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {format(new Date(meeting.scheduled_date), 'h:mm a')} 
                    <span className="text-xs">
                      ({meeting.duration_minutes} min)
                    </span>
                  </div>

                  {meeting.meeting_link && (
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-blue-500" />
                      <a
                        href={meeting.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline text-sm"
                      >
                        Join Meeting
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
