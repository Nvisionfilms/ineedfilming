import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { Resend } from "https://esm.sh/resend@3.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      throw new Error('Missing signature or webhook secret');
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log('Webhook event received:', event.type);

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      console.log('Payment successful, creating booking:', metadata);

      // Create booking request in database
      const { error: bookingError } = await supabaseClient
        .from('custom_booking_requests')
        .insert({
          client_name: metadata?.customerName || '',
          client_email: session.customer_email || metadata?.customerEmail || '',
          client_phone: metadata?.customerPhone || '',
          client_company: metadata?.company || '',
          client_type: 'commercial',
          requested_price: (session.amount_total || 0) / 100,
          deposit_amount: (session.amount_total || 0) / 100,
          project_details: metadata?.projectDetails || '',
          booking_date: metadata?.bookingDate || new Date().toISOString().split('T')[0],
          booking_time: metadata?.bookingTime || '09:00',
          status: 'approved', // Auto-approve paid bookings
          approved_price: (session.amount_total || 0) / 100,
          approved_at: new Date().toISOString(),
          admin_notes: `Payment received via Stripe. Session ID: ${session.id}`,
        });

      if (bookingError) {
        console.error('Error creating booking:', bookingError);
        throw bookingError;
      }

      // Create payment record
      const { error: paymentError } = await supabaseClient
        .from('payments')
        .insert({
          amount: (session.amount_total || 0) / 100,
          status: 'completed',
          payment_method: 'stripe',
          stripe_payment_id: session.payment_intent as string,
          metadata: {
            session_id: session.id,
            customer_email: session.customer_email,
          },
        });

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
      }

      console.log('Booking and payment created successfully');

      // Create client portal account and send credentials
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      const tempPassword = `NV${Math.random().toString(36).slice(-8)}${Date.now().toString(36).slice(-4)}!`;
      
      // Create auth user
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email: session.customer_email || metadata?.customerEmail || '',
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: metadata?.customerName || '',
        },
      });

      if (authError) {
        console.error("Error creating auth user:", authError);
      } else if (authData.user) {
        console.log("Auth user created:", authData.user.id);
        
        // Get the booking ID we just created
        const { data: newBooking } = await supabaseClient
          .from("custom_booking_requests")
          .select("id")
          .eq("client_email", session.customer_email || metadata?.customerEmail || '')
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        
        // Create client account
        const { error: clientError } = await supabaseClient
          .from("client_accounts")
          .insert({
            user_id: authData.user.id,
            booking_id: newBooking?.id,
            company_name: metadata?.company || metadata?.customerName || '',
            status: "active",
          });

        if (clientError) {
          console.error("Error creating client account:", clientError);
        } else {
          console.log("Client account created successfully");
        }

        // Add client role
        const { error: roleError } = await supabaseClient
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: "client",
          });

        if (roleError) {
          console.error("Error adding client role:", roleError);
        }

        // Send credentials email
        try {
          await resend.emails.send({
            from: "Eric Sattler <contact@nvisionfilms.com>",
            to: [session.customer_email || metadata?.customerEmail || ''],
            subject: "Your Client Portal Access - New Vision Production",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #10b981;">Welcome to New Vision Production!</h1>
                <p>Hi ${metadata?.customerName || 'there'},</p>
                <p>Thank you for your payment! Your booking is confirmed and we've created your client portal account.</p>
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="margin-top: 0;">Your Login Credentials:</h2>
                  <p><strong>Email:</strong> ${session.customer_email || metadata?.customerEmail}</p>
                  <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                </div>
                <p><strong>Important:</strong> Please change your password after your first login.</p>
                <div style="margin: 30px 0; text-align: center;">
                  <a href="${req.headers.get("origin") || 'https://nvisionfilms.netlify.app'}/client/login" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Access Client Portal</a>
                </div>
                <p>In your portal, you can:</p>
                <ul>
                  <li>View project status and deliverables</li>
                  <li>Upload and share files</li>
                  <li>Communicate with our team</li>
                  <li>Track project milestones</li>
                </ul>
                <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br/>Eric Sattler<br/>New Vision Production</p>
              </div>
            `,
          });
          console.log("Client portal credentials email sent");
        } catch (emailError) {
          console.error("Error sending credentials email:", emailError);
        }
      }
    }


    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in stripe webhook handler:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
