import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { pool } from '../index.js';
import bcrypt from 'bcrypt';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

// Webhook handler - must use raw body
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log('Webhook event received:', event.type);

  try {
    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};

      console.log('Payment successful, creating booking:', metadata);

      // Create booking
      const bookingResult = await pool.query(
        `INSERT INTO bookings (
          client_name, client_email, client_phone, booking_type,
          booking_date, booking_time, status, requested_price,
          approved_price, deposit_amount, event_details, admin_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id`,
        [
          metadata.customerName || '',
          session.customer_email || metadata.customerEmail || '',
          metadata.customerPhone || '',
          metadata.bookingType || 'event',
          metadata.bookingDate || new Date().toISOString().split('T')[0],
          metadata.bookingTime || '09:00',
          'approved', // Auto-approve paid bookings
          (session.amount_total || 0) / 100,
          (session.amount_total || 0) / 100,
          (session.amount_total || 0) / 100,
          metadata.projectDetails || '',
          `Payment received via Stripe. Session ID: ${session.id}`
        ]
      );

      const bookingId = bookingResult.rows[0].id;

      // Create payment record
      await pool.query(
        `INSERT INTO payments (
          booking_id, stripe_checkout_session_id, stripe_payment_intent_id,
          amount, status, payment_type, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          bookingId,
          session.id,
          session.payment_intent as string,
          (session.amount_total || 0) / 100,
          'succeeded',
          'deposit',
          'Stripe checkout payment'
        ]
      );

      // Create client account
      const tempPassword = `NV${Math.random().toString(36).slice(-8)}${Date.now().toString(36).slice(-4)}!`;
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, role, email_verified)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
         RETURNING id`,
        [
          session.customer_email || metadata.customerEmail || '',
          passwordHash,
          metadata.customerName || '',
          'client',
          true
        ]
      );

      const userId = userResult.rows[0].id;

      // Create client account entry
      await pool.query(
        `INSERT INTO client_accounts (user_id, booking_id, company_name, status)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO UPDATE SET booking_id = $2, updated_at = NOW()`,
        [userId, bookingId, metadata.company || metadata.customerName || '', 'active']
      );

      // TODO: Send welcome email with credentials via Resend
      console.log('Booking, payment, and client account created successfully');
      console.log('Client credentials:', {
        email: session.customer_email,
        tempPassword: tempPassword
      });
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create checkout session
router.post('/create-checkout-session', async (req: Request, res: Response) => {
  try {
    const { amount, customerEmail, customerName, metadata } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: metadata?.bookingType || 'Video Production Service',
              description: metadata?.projectDetails || '',
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/booking-portal`,
      customer_email: customerEmail,
      metadata: metadata || {},
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
