import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const { packageId, packageName, amount, paymentType, bookingDetails, countdownExpiry } = await req.json();

    console.log('Creating checkout session for:', { packageId, amount, paymentType });

    // Validate countdown timer hasn't expired
    if (countdownExpiry) {
      const expiryDate = new Date(countdownExpiry);
      const now = new Date();
      
      if (now > expiryDate) {
        throw new Error('Limited time offer has expired. Please refresh the page.');
      }
    }

    const session = await stripe.checkout.sessions.create({
      expires_at: countdownExpiry ? Math.floor(new Date(countdownExpiry).getTime() / 1000) : undefined,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: packageName,
              description: paymentType === 'deposit' 
                ? `Deposit for ${packageName}` 
                : `Full payment for ${packageName}`,
              metadata: {
                bookingDate: bookingDetails.date,
                bookingTime: bookingDetails.time,
                customerName: bookingDetails.name,
                customerEmail: bookingDetails.email,
                customerPhone: bookingDetails.phone,
              },
            },
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/booking-portal`,
      customer_email: bookingDetails.email,
      metadata: {
        packageId,
        paymentType,
        bookingDate: bookingDetails.date,
        bookingTime: bookingDetails.time,
        customerName: bookingDetails.name,
        customerPhone: bookingDetails.phone,
        company: bookingDetails.company || '',
        projectDetails: bookingDetails.projectDetails || '',
      },
    });

    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
