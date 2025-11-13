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

    // Handle checkout session completed (for both payment links and direct checkouts)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      console.log('Checkout session completed:', {
        session_id: session.id,
        payment_intent: session.payment_intent,
        metadata: metadata
      });

      // Check if this is from a payment link (has booking_id in metadata)
      if (metadata?.booking_id) {
        console.log('Payment link completed for booking:', metadata.booking_id);

        // Update existing payment record to succeeded
        const { data: existingPayment, error: findError } = await supabaseClient
          .from('payments')
          .select('*')
          .eq('booking_id', metadata.booking_id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existingPayment) {
          console.log('Updating existing payment record:', existingPayment.id);
          
          const { error: updateError } = await supabaseClient
            .from('payments')
            .update({
              status: 'succeeded',
              stripe_payment_id: session.payment_intent as string,
              paid_at: new Date().toISOString(),
              metadata: {
                ...existingPayment.metadata,
                session_id: session.id,
                payment_method: session.payment_method_types?.[0],
              }
            })
            .eq('id', existingPayment.id);

          if (updateError) {
            console.error('Error updating payment:', updateError);
          } else {
            console.log('Payment updated to succeeded');
          }
        } else {
          console.log('No pending payment found, creating new payment record');
          
          // Create new payment record if none exists
          const { error: createError } = await supabaseClient
            .from('payments')
            .insert({
              booking_id: metadata.booking_id,
              amount: (session.amount_total || 0) / 100,
              currency: 'usd',
              status: 'succeeded',
              payment_type: 'deposit',
              stripe_payment_id: session.payment_intent as string,
              paid_at: new Date().toISOString(),
              metadata: {
                session_id: session.id,
                payment_method: session.payment_method_types?.[0],
              }
            });

          if (createError) {
            console.error('Error creating payment:', createError);
          }
        }

        // Update booking deposit_paid status
        await supabaseClient
          .from('custom_booking_requests')
          .update({
            deposit_paid: true,
            deposit_paid_at: new Date().toISOString()
          })
          .eq('id', metadata.booking_id);

      } else {
        // This is a direct checkout (not from payment link)
        console.log('Direct checkout completed, creating booking');

        // Create booking request
        const { data: newBooking, error: bookingError } = await supabaseClient
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
            status: 'approved',
            approved_price: (session.amount_total || 0) / 100,
            approved_at: new Date().toISOString(),
            admin_notes: `Payment received via Stripe. Session ID: ${session.id}`,
            deposit_paid: true,
            deposit_paid_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (bookingError) {
          console.error('Error creating booking:', bookingError);
          throw bookingError;
        }

        // Create payment record
        const { error: paymentError } = await supabaseClient
          .from('payments')
          .insert({
            booking_id: newBooking.id,
            amount: (session.amount_total || 0) / 100,
            currency: 'usd',
            status: 'succeeded',
            payment_type: 'deposit',
            stripe_payment_id: session.payment_intent as string,
            paid_at: new Date().toISOString(),
            metadata: {
              session_id: session.id,
              payment_method: session.payment_method_types?.[0],
            },
          });

        if (paymentError) {
          console.error('Error creating payment record:', paymentError);
        }

        console.log('Booking and payment created successfully');
      }
    }

    // Handle payment intent succeeded (additional confirmation)
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log('Payment intent succeeded:', paymentIntent.id);

      // Update payment record if it exists
      const { error: updateError } = await supabaseClient
        .from('payments')
        .update({
          status: 'succeeded',
          paid_at: new Date().toISOString(),
        })
        .eq('stripe_payment_id', paymentIntent.id)
        .eq('status', 'pending');

      if (updateError) {
        console.error('Error updating payment on payment_intent.succeeded:', updateError);
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
