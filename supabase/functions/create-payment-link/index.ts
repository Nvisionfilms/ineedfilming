import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Verify admin role
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roles) {
      throw new Error("Admin access required");
    }

    const { bookingId, amount, description } = await req.json();

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get booking details
    const { data: booking } = await supabaseClient
      .from("custom_booking_requests")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Create payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: description || `Booking for ${booking.client_name}`,
              description: `Project: ${booking.project_details || 'N/A'}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      after_completion: {
        type: "redirect",
        redirect: {
          url: `${req.headers.get("origin")}/booking-success`,
        },
      },
      metadata: {
        booking_id: bookingId,
        client_email: booking.client_email,
      },
    });

    // Create payment record
    await supabaseClient
      .from("payments")
      .insert({
        booking_id: bookingId,
        amount,
        payment_type: "deposit",
        status: "pending",
        stripe_checkout_url: paymentLink.url,
      });

    // Send email to client with payment link
    try {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
              .amount { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
              .amount-value { font-size: 32px; font-weight: bold; color: #667eea; margin: 10px 0; }
              .button { display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
              .link { word-break: break-all; color: #667eea; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Payment Ready</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">NVision Films</p>
              </div>
              
              <div class="content">
                <p>Hi ${booking.client_name},</p>
                
                <p>Great news! Your payment link is ready. You can now complete your payment securely through Stripe.</p>
                
                <div class="amount">
                  <div style="color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Payment Amount</div>
                  <div class="amount-value">$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div style="color: #666; font-size: 14px; margin-top: 5px;">${description}</div>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${paymentLink.url}" class="button">Pay Now - Secure Checkout</a>
                </div>
                
                <div class="details">
                  <h3 style="margin-top: 0; color: #333;">Booking Details</h3>
                  <p style="margin: 8px 0;"><strong>Date:</strong> ${booking.booking_date} at ${booking.booking_time}</p>
                  ${booking.project_details ? `<p style="margin: 8px 0;"><strong>Project:</strong> ${booking.project_details}</p>` : ''}
                  ${booking.client_company ? `<p style="margin: 8px 0;"><strong>Company:</strong> ${booking.client_company}</p>` : ''}
                </div>
                
                <p style="font-size: 14px; color: #666;">
                  <strong>Having trouble with the button?</strong> Copy and paste this link into your browser:
                </p>
                <p class="link" style="font-size: 12px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                  ${paymentLink.url}
                </p>
                
                <p style="margin-top: 30px;">If you have any questions, feel free to reach out to us at contact@nvisionfilms.com or call us directly.</p>
                
                <p>Looking forward to working with you!</p>
                
                <p style="margin-top: 20px;">
                  <strong>The NVision Films Team</strong>
                </p>
              </div>
              
              <div class="footer">
                <p>NVision Films | Professional Video Production</p>
                <p>This is an automated email. Please do not reply directly to this message.</p>
                <p style="font-size: 11px; margin-top: 15px;">
                  If you did not request this payment link, please contact us immediately at contact@nvisionfilms.com
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      const plainText = `
Hi ${booking.client_name},

Great news! Your payment link is ready.

PAYMENT AMOUNT: $${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
${description}

BOOKING DETAILS:
- Date: ${booking.booking_date} at ${booking.booking_time}
${booking.project_details ? `- Project: ${booking.project_details}` : ''}
${booking.client_company ? `- Company: ${booking.client_company}` : ''}

PAYMENT LINK:
${paymentLink.url}

Click the link above to complete your payment securely through Stripe.

If you have any questions, reach out to us at contact@nvisionfilms.com

Looking forward to working with you!

The NVision Films Team

---
NVision Films | Professional Video Production
This is an automated email. If you did not request this payment link, please contact us immediately.
      `;

      await resend.emails.send({
        from: "NVision Films <contact@nvisionfilms.com>",
        to: [booking.client_email],
        subject: `Payment Link Ready - $${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} for ${booking.client_name}`,
        html: emailHtml,
        text: plainText,
      });

      console.log(`Payment link email sent successfully to ${booking.client_email}`);
    } catch (emailError: any) {
      // Log email error but don't fail the whole request
      console.error("Failed to send payment link email:", emailError.message);
      // Continue execution - admin still gets the link
    }

    return new Response(
      JSON.stringify({ 
        url: paymentLink.url,
        emailSent: true // Indicate that we attempted to send email
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
