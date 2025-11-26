import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@3.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterRequest {
  name?: string;
  email: string;
  source?: string;
  metadata?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { name, email, source = "exit_popup", metadata }: NewsletterRequest = await req.json();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Rate limiting: Check for recent submissions from this email
    const { data: recentSubmissions } = await supabaseClient
      .from("newsletter_subscribers")
      .select("subscribed_at")
      .eq("email", email.toLowerCase().trim())
      .gte("subscribed_at", new Date(Date.now() - 60000).toISOString()) // Last minute
      .limit(1);

    if (recentSubmissions && recentSubmissions.length > 0) {
      console.log("Rate limit: Recent submission detected for", email);
      return new Response(
        JSON.stringify({ error: "Please wait before subscribing again" }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Newsletter signup:", { email, name, source });

    // Initialize Resend for email notifications
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Insert into newsletter_subscribers table
    const { error: subscriberError } = await supabaseClient
      .from("newsletter_subscribers")
      .insert({
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        source,
        metadata,
      });

    if (subscriberError) {
      if (subscriberError.code === "23505") {
        // Already subscribed - still create opportunity if needed
        console.log("Email already subscribed, creating opportunity anyway");
      } else {
        throw subscriberError;
      }
    } else {
      console.log("Newsletter subscriber created successfully");
    }

    // Create opportunity/lead in CRM
    const { error: oppError } = await supabaseClient
      .from("opportunities")
      .insert({
        contact_name: name?.trim() || email.split("@")[0],
        contact_email: email.toLowerCase().trim(),
        service_type: "Newsletter Subscriber",
        notes: `Newsletter signup from ${metadata?.subscribed_from || 'website'}`,
        stage: "new_lead",
        source: "newsletter_popup",
      });

    if (oppError) {
      console.error("Error creating opportunity:", oppError);
      // Don't fail the request if opportunity creation fails
    } else {
      console.log("Opportunity created successfully");
    }

    // Send notification email to admin
    try {
      const adminEmail = await resend.emails.send({
        from: "NVision Films <contact@nvisionfilms.com>",
        to: ["nvisionmg@gmail.com"],
        subject: "New Newsletter Subscriber",
        html: `
          <h1>New Newsletter Subscriber</h1>
          <p><strong>Name:</strong> ${name || 'Not provided'}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Source:</strong> ${source}</p>
          <p><strong>Subscribed from:</strong> ${metadata?.subscribed_from || 'website'}</p>
          <hr/>
          <p>View this subscriber in your admin dashboard.</p>
        `,
      });
      console.log("Admin notification email sent successfully:", adminEmail);
    } catch (emailError) {
      console.error("Failed to send admin notification email:", emailError);
      // Don't fail the signup if email fails
    }

    // Send welcome email to subscriber
    try {
      const welcomeEmail = await resend.emails.send({
        from: "NVISION FILMS LLC <contact@nvisionfilms.com>",
        to: [email],
        subject: "Welcome to NVISION FILMS LLC",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://static.wixstatic.com/media/e05d6c_796390cb4e7a447ebd2fa7dc927276c3~mv2.png/v1/fill/w_219,h_114,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/e05d6c_796390cb4e7a447ebd2fa7dc927276c3~mv2.png" alt="NVISION FILMS LLC" style="max-width: 180px; height: auto;" />
            </div>
            <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Welcome to NVISION FILMS LLC!</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">${name ? `Hi ${name},` : 'Hi there,'}</p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Thank you for subscribing to our newsletter. We're excited to share updates, project showcases, and exclusive insights with you.</p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">Stay tuned for our next update!</p>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br/>Eric Sattler<br/>NVISION FILMS LLC</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              NVISION FILMS LLC<br>
              If you wish to unsubscribe, reply to this email.
            </p>
          </div>
        `,
      });
      console.log("Welcome email sent successfully:", welcomeEmail);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the signup if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alreadySubscribed: subscriberError?.code === "23505" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in submit-newsletter function:", error);
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
