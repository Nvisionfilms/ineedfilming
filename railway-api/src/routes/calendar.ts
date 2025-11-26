import { Router, Response } from 'express';
import { pool } from '../index.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { google } from 'googleapis';

const router = Router();

// Initialize Google Calendar API
const getCalendarClient = () => {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!privateKey || !clientEmail || !calendarId) {
    throw new Error('Google Calendar credentials not configured');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return { calendar: google.calendar({ version: 'v3', auth }), calendarId };
};

// Create calendar event for a meeting
router.post('/sync', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { meetingId } = req.body;

    // Get meeting details
    const meetingResult = await pool.query(
      `SELECT m.*, u.full_name as client_name, u.email as client_email
       FROM meetings m
       LEFT JOIN users u ON m.client_id = u.id
       WHERE m.id = $1`,
      [meetingId]
    );

    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const meeting = meetingResult.rows[0];
    const { calendar, calendarId } = getCalendarClient();

    // Create event
    const event = {
      summary: meeting.title || `Meeting with ${meeting.client_name || 'Client'}`,
      description: meeting.notes || '',
      location: meeting.location || '',
      start: {
        dateTime: new Date(meeting.scheduled_at).toISOString(),
        timeZone: 'America/Chicago',
      },
      end: {
        dateTime: new Date(new Date(meeting.scheduled_at).getTime() + (meeting.duration_minutes || 60) * 60000).toISOString(),
        timeZone: 'America/Chicago',
      },
      attendees: meeting.client_email ? [{ email: meeting.client_email }] : [],
      conferenceData: {
        createRequest: {
          requestId: `nvision-${meetingId}-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 30 }, // 30 min before
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
    });

    // Update meeting with Google Calendar event ID and Meet link
    const meetLink = response.data.conferenceData?.entryPoints?.find(
      (e: any) => e.entryPointType === 'video'
    )?.uri;

    await pool.query(
      `UPDATE meetings 
       SET google_event_id = $1, meet_link = $2, updated_at = NOW()
       WHERE id = $3`,
      [response.data.id, meetLink || null, meetingId]
    );

    res.json({
      success: true,
      eventId: response.data.id,
      meetLink,
      htmlLink: response.data.htmlLink,
    });
  } catch (error: any) {
    console.error('Calendar sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update calendar event
router.put('/sync/:meetingId', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { meetingId } = req.params;

    // Get meeting details
    const meetingResult = await pool.query(
      `SELECT m.*, u.full_name as client_name, u.email as client_email
       FROM meetings m
       LEFT JOIN users u ON m.client_id = u.id
       WHERE m.id = $1`,
      [meetingId]
    );

    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const meeting = meetingResult.rows[0];

    if (!meeting.google_event_id) {
      return res.status(400).json({ error: 'Meeting not synced to Google Calendar' });
    }

    const { calendar, calendarId } = getCalendarClient();

    const event = {
      summary: meeting.title || `Meeting with ${meeting.client_name || 'Client'}`,
      description: meeting.notes || '',
      location: meeting.location || '',
      start: {
        dateTime: new Date(meeting.scheduled_at).toISOString(),
        timeZone: 'America/Chicago',
      },
      end: {
        dateTime: new Date(new Date(meeting.scheduled_at).getTime() + (meeting.duration_minutes || 60) * 60000).toISOString(),
        timeZone: 'America/Chicago',
      },
      attendees: meeting.client_email ? [{ email: meeting.client_email }] : [],
    };

    const response = await calendar.events.update({
      calendarId,
      eventId: meeting.google_event_id,
      requestBody: event,
      sendUpdates: 'all',
    });

    res.json({
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
    });
  } catch (error: any) {
    console.error('Calendar update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete calendar event
router.delete('/sync/:meetingId', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { meetingId } = req.params;

    const meetingResult = await pool.query(
      'SELECT google_event_id FROM meetings WHERE id = $1',
      [meetingId]
    );

    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const meeting = meetingResult.rows[0];

    if (!meeting.google_event_id) {
      return res.status(400).json({ error: 'Meeting not synced to Google Calendar' });
    }

    const { calendar, calendarId } = getCalendarClient();

    await calendar.events.delete({
      calendarId,
      eventId: meeting.google_event_id,
      sendUpdates: 'all',
    });

    // Clear Google event ID from meeting
    await pool.query(
      'UPDATE meetings SET google_event_id = NULL, meet_link = NULL, updated_at = NOW() WHERE id = $1',
      [meetingId]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Calendar delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get upcoming events from Google Calendar
router.get('/events', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { calendar, calendarId } = getCalendarClient();

    const response = await calendar.events.list({
      calendarId,
      timeMin: new Date().toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json(response.data.items || []);
  } catch (error: any) {
    console.error('Calendar list error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
