import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReviewRequestPayload {
  clientEmail: string;
  clientName: string;
  projectName: string;
  googleReviewUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientEmail, clientName, projectName, googleReviewUrl }: ReviewRequestPayload = await req.json();

    console.log("Sending review request to:", clientEmail);

    const reviewUrl = googleReviewUrl || "https://www.google.com/search?q=nvision+video+production";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NVision <onboarding@resend.dev>",
        to: [clientEmail],
        subject: `How was your experience with ${projectName}?`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Hi ${clientName}! 👋</h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              We hope you're loving your <strong>${projectName}</strong> deliverables!
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Your feedback means the world to us. If you have a moment, we'd appreciate 
              it if you could share your experience with others by leaving a review.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${reviewUrl}" 
                 style="background-color: #000; color: #fff; padding: 14px 28px; 
                        text-decoration: none; border-radius: 6px; font-weight: bold;
                        display: inline-block;">
                Leave a Google Review ⭐
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Thank you for trusting us with your vision!
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best,<br>
              The NVision Team
            </p>
          </div>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    console.log("Review request email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, emailData }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-review-request function:", error);
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
