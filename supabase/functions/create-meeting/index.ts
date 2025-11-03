import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateMeetingRequest {
  projectId: string | null;
  clientId: string | null;
  bookingId?: string | null;
  opportunityId?: string | null;
  clientEmail: string;
  clientName: string;
  title: string;
  description?: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create client with anon key to verify user auth
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! }
        }
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Use service role key for database operations (bypasses RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { 
      projectId, 
      clientId,
      bookingId,
      opportunityId,
      clientEmail, 
      clientName, 
      title, 
      description, 
      scheduledAt, 
      durationMinutes, 
      meetingLink 
    }: CreateMeetingRequest = await req.json();

    console.log("Creating meeting:", { title, scheduledAt, durationMinutes, meetingLink, bookingId, opportunityId });

    // Insert meeting into database
    const { data: meeting, error: insertError } = await supabase
      .from("meetings")
      .insert({
        project_id: projectId,
        client_id: clientId,
        booking_id: bookingId || null,
        opportunity_id: opportunityId || null,
        title,
        description,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        meeting_link: meetingLink,
        status: "scheduled",
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    console.log("Meeting created successfully:", meeting.id);

    // Send email invitation to client
    const startTime = new Date(scheduledAt);
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You're Invited to a Meeting</h2>
        <p>Hi ${clientName},</p>
        <p>You have been invited to a meeting with Nvision Media Group:</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${title}</h3>
          ${description ? `<p>${description}</p>` : ''}
          <p><strong>When:</strong> ${startTime.toLocaleString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
          })}</p>
          <p><strong>Duration:</strong> ${durationMinutes} minutes</p>
          <p><strong>Join via Google Meet:</strong><br/>
            <a href="${meetingLink}" style="color: #0066cc; font-size: 16px; font-weight: bold;">${meetingLink}</a>
          </p>
        </div>

        <p>Looking forward to speaking with you!</p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Nvision Media Group<br/>
          Professional Video Production
        </p>
      </div>
    `;

    // Send email using Resend API
    try {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Nvision Media Group <meetings@nvisionmg.com>",
          to: [clientEmail],
          subject: `Meeting Invitation: ${title}`,
          html: emailHtml,
        }),
      });

      const emailData = await emailResponse.json();
      console.log("Email invitation sent:", emailData);
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      // Don't fail the whole request if email fails
    }

    return new Response(JSON.stringify({ success: true, meeting }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error creating meeting:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
