import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from 'https://esm.sh/stripe@14.21.0';

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
