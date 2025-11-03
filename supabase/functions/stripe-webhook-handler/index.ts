import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@3.5.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StrategySessionRequest {
  name: string;
  email: string;
  projectType: string;
  budget: number;
  mood: string;
  genre: string;
  filmingTime: string;
  preferredDate?: string;
  preferredTime?: string;
  honeypot?: string;
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

    const { name, email, projectType, budget, mood, genre, filmingTime, preferredDate, preferredTime, honeypot }: StrategySessionRequest = await req.json();

    // Honeypot check - if filled, it's a bot
    if (honeypot && honeypot.length > 0) {
      console.log("Bot submission detected via honeypot field");
      return new Response(
        JSON.stringify({ error: "Invalid submission" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log("Sending strategy session email:", { name, email, projectType });

    // CONTACT/STRATEGY SESSION FLOW: Lead is INTERESTED but not sold yet
    // Stage: "new_lead" (consultation needed)
    // Creates: opportunity (LEAD) → can schedule consultation meeting
    console.log("Creating opportunity for strategy session lead:", { name, email });
    
    const { data: opportunity, error: oppError } = await supabaseClient
      .from("opportunities")
      .insert({
        contact_name: name,
        contact_email: email,
        service_type: projectType,
        budget_min: budget,
        budget_max: budget,
        notes: `Strategy session request - Mood: ${mood}, Genre: ${genre}, Filming Time: ${filmingTime}${preferredDate ? `, Preferred Date: ${preferredDate}` : ''}${preferredTime ? `, Preferred Time: ${preferredTime}` : ''}`,
        stage: "new_lead", // They need consultation
        source: "strategy_session_form"
      })
      .select()
      .single();

    if (oppError) {
      console.error("Error creating opportunity:", oppError);
      // Don't fail the request if opportunity creation fails
    } else {
      console.log("Lead opportunity created successfully, ID:", opportunity?.id);
    }

    // Send confirmation email to the user
    const userEmailResponse = await resend.emails.send({
      from: "NVision Films <contact@nvisionfilms.com>",
      to: [email],
      subject: "Your Free Strategy Session Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Thank You, ${name}!</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            We've received your strategy session request and will get back to you within 24 hours.
          </p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #555; margin-top: 0; font-size: 18px;">Your Project Details:</h2>
            <p style="margin: 8px 0; color: #333;"><strong>Project Type:</strong> ${projectType}</p>
            <p style="margin: 8px 0; color: #333;"><strong>Budget:</strong> $${budget.toLocaleString()}</p>
            <p style="margin: 8px 0; color: #333;"><strong>Mood:</strong> ${mood}</p>
            <p style="margin: 8px 0; color: #333;"><strong>Genre:</strong> ${genre}</p>
            <p style="margin: 8px 0; color: #333;"><strong>Filming Time:</strong> ${filmingTime}</p>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Best regards,<br>
            The NVision Team
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            NVision Films<br>
            If you have questions, reply to this email.
          </p>
        </div>
      `,
    });

    // Send notification email to admin
    const adminEmailResponse = await resend.emails.send({
      from: "NVision Films <contact@nvisionfilms.com>",
      to: ["contact@nvisionfilms.com"],
      subject: `New Strategy Session: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">New Strategy Session Request</h1>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #555; margin-top: 0; font-size: 18px;">Contact Information:</h2>
            <p style="margin: 8px 0; color: #333;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 8px 0; color: #333;"><strong>Email:</strong> ${email}</p>
            
            <h2 style="color: #555; margin-top: 20px; font-size: 18px;">Project Details:</h2>
            <p style="margin: 8px 0; color: #333;"><strong>Project Type:</strong> ${projectType}</p>
            <p style="margin: 8px 0; color: #333;"><strong>Budget:</strong> $${budget.toLocaleString()}</p>
            <p style="margin: 8px 0; color: #333;"><strong>Mood:</strong> ${mood}</p>
            <p style="margin: 8px 0; color: #333;"><strong>Genre:</strong> ${genre}</p>
            <p style="margin: 8px 0; color: #333;"><strong>Filming Time:</strong> ${filmingTime}</p>
          </div>
        </div>
      `,
    });

    console.log("Emails sent successfully:", { userEmailResponse, adminEmailResponse });

    return new Response(
      JSON.stringify({ success: true, message: "Emails sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-strategy-session function:", error);
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
