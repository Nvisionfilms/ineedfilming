import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import railwayApi from "@/lib/railwayApi";
import { format, isSameDay, parseISO } from "date-fns";
import { Clock, Video, User, ExternalLink, RefreshCw } from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string | null;
  meet_link?: string | null;
  status: string;
  description: string | null;
  booking_id: string | null;
  client_id: string | null;
  google_event_id?: string | null;
  custom_booking_requests?: {
    client_name: string;
    client_email: string;
  };
  client_accounts?: {
    full_name: string;
    email: string;
  };
}

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink: string;
  hangoutLink?: string;
  location?: string;
}

interface MeetingsCalendarProps {
  userRole?: "admin" | "client";
  clientId?: string;
}

export const MeetingsCalendar = ({ userRole = "admin", clientId }: MeetingsCalendarProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [selectedDayMeetings, setSelectedDayMeetings] = useState<Meeting[]>([]);
  const [selectedDayGoogleEvents, setSelectedDayGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  useEffect(() => {
    loadMeetings();
    if (userRole === 'admin') {
      loadGoogleEvents();
    }
  }, [clientId, userRole]);

  useEffect(() => {
    if (date) {
      // Filter local meetings for selected day
      const dayMeetings = meetings.filter(meeting => {
        if (!meeting.scheduled_at) return false;
        const meetingDate = new Date(meeting.scheduled_at);
        if (isNaN(meetingDate.getTime())) return false;
        return isSameDay(meetingDate, date);
      });
      setSelectedDayMeetings(dayMeetings);

      // Filter Google events for selected day
      const dayGoogleEvents = googleEvents.filter(event => {
        const eventDate = event.start.dateTime 
          ? new Date(event.start.dateTime) 
          : event.start.date 
            ? new Date(event.start.date) 
            : null;
        if (!eventDate) return false;
        return isSameDay(eventDate, date);
      });
      setSelectedDayGoogleEvents(dayGoogleEvents);
    } else {
      setSelectedDayMeetings([]);
      setSelectedDayGoogleEvents([]);
    }
  }, [date, meetings, googleEvents]);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      
      // Use Railway API
      const { data, error } = await api.getMeetings();
      
      // Filter client-side if needed
      let filteredData = data || [];
      if (userRole === 'client' && clientId) {
        filteredData = filteredData.filter((m: any) => m.client_id === clientId);
      }
      // Filter for scheduled only
      filteredData = filteredData.filter((m: any) => m.status === 'scheduled');

      if (error) throw error;
      setMeetings(filteredData || []);
    } catch (error) {
      console.error('Error loading meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleEvents = async () => {
    try {
      setLoadingGoogle(true);
      const events = await railwayApi.calendar.getEvents();
      setGoogleEvents(events || []);
    } catch (error) {
      console.error('Error loading Google Calendar events:', error);
    } finally {
      setLoadingGoogle(false);
    }
  };

  // Get dates that have meetings for highlighting (filter out invalid dates)
  const meetingDates = meetings
    .filter(m => m.scheduled_at && !isNaN(new Date(m.scheduled_at).getTime()))
    .map(m => new Date(m.scheduled_at));

  // Get dates from Google Calendar events
  const googleEventDates = googleEvents
    .map(e => e.start.dateTime ? new Date(e.start.dateTime) : e.start.date ? new Date(e.start.date) : null)
    .filter((d): d is Date => d !== null && !isNaN(d.getTime()));

  // Combine all dates for highlighting
  const allEventDates = [...meetingDates, ...googleEventDates];

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
              meeting: allEventDates,
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

      {/* Selected Day Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
              </CardTitle>
              <CardDescription>
                {(selectedDayMeetings.length + selectedDayGoogleEvents.length) === 0 
                  ? 'No events scheduled for this day'
                  : `${selectedDayMeetings.length + selectedDayGoogleEvents.length} event${(selectedDayMeetings.length + selectedDayGoogleEvents.length) > 1 ? 's' : ''} scheduled`}
              </CardDescription>
            </div>
            {userRole === 'admin' && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => { loadMeetings(); loadGoogleEvents(); }}
                disabled={loading || loadingGoogle}
              >
                <RefreshCw className={`w-4 h-4 ${(loading || loadingGoogle) ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading...
            </div>
          ) : (selectedDayMeetings.length + selectedDayGoogleEvents.length) === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No events on this day
            </div>
          ) : (
            <>
              {/* Local Meetings */}
              {selectedDayMeetings.map((meeting) => (
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
                    <div className="flex items-center gap-2">
                      {meeting.google_event_id && (
                        <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                          Synced
                        </Badge>
                      )}
                      <Badge className={getStatusColor(meeting.status)}>
                        {meeting.status}
                      </Badge>
                    </div>
                  </div>

                  {meeting.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {meeting.description}
                    </p>
                  )}

                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {format(new Date(meeting.scheduled_at), 'h:mm a')} 
                      <span className="text-xs">
                        ({meeting.duration_minutes} min)
                      </span>
                    </div>

                    {(meeting.meet_link || meeting.meeting_link) && (
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-blue-500" />
                        <a
                          href={meeting.meet_link || meeting.meeting_link || ''}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline text-sm"
                        >
                          {meeting.meet_link ? 'Join Google Meet' : 'Join Meeting'}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Google Calendar Events (not synced from our system) */}
              {selectedDayGoogleEvents
                .filter(ge => !meetings.some(m => m.google_event_id === ge.id))
                .map((event) => (
                  <div
                    key={event.id}
                    className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{event.summary}</h4>
                        {event.location && (
                          <p className="text-sm text-muted-foreground mt-1">
                            📍 {event.location}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        Google Cal
                      </Badge>
                    </div>

                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {event.start.dateTime 
                          ? format(new Date(event.start.dateTime), 'h:mm a')
                          : 'All day'}
                      </div>

                      <div className="flex items-center gap-2">
                        {event.hangoutLink && (
                          <a
                            href={event.hangoutLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline text-sm flex items-center gap-1"
                          >
                            <Video className="w-4 h-4" />
                            Join Meet
                          </a>
                        )}
                        <a
                          href={event.htmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:underline text-sm flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View in Calendar
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
