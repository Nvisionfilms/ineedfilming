import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { pool } from '../index.js';
import bcrypt from 'bcrypt';
import { Resend } from 'resend';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const SITE_URL = process.env.SITE_URL || 'https://ineedfilming.com';

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

      // Create project for the client
      const projectName = `${metadata.customerName || 'Client'} - ${metadata.bookingType || 'Video Production'}`;
      await pool.query(
        `INSERT INTO projects (
          title, client_name, client_email, client_id, booking_id,
          project_type, shoot_date, status, budget, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          projectName,
          metadata.customerName || '',
          session.customer_email || metadata.customerEmail || '',
          userId,
          bookingId,
          metadata.bookingType || 'Video Production',
          metadata.bookingDate || new Date().toISOString().split('T')[0],
          'active',
          (session.amount_total || 0) / 100,
          metadata.projectDetails || ''
        ]
      );

      // Send welcome email with credentials
      if (resend && session.customer_email) {
        await resend.emails.send({
          from: 'NVISION FILMS LLC <contact@nvisionfilms.com>',
          to: [session.customer_email],
          subject: '🎬 Welcome to NVISION FILMS - Your Client Portal Access',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
              <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 20px;">
                  <img src="https://static.wixstatic.com/media/e05d6c_796390cb4e7a447ebd2fa7dc927276c3~mv2.png/v1/fill/w_219,h_114,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/e05d6c_796390cb4e7a447ebd2fa7dc927276c3~mv2.png" alt="NVISION FILMS LLC" style="max-width: 150px; height: auto;" />
                </div>
                
                <h1 style="color: #16a34a; font-size: 24px; margin-bottom: 20px;">🎉 Payment Confirmed!</h1>
                <p style="font-size: 16px; line-height: 1.6; color: #333;">Hi ${metadata.customerName || 'there'},</p>
                <p style="font-size: 16px; line-height: 1.6; color: #333;">Thank you for your payment! Your project is now active and we're excited to work with you.</p>
                
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
                  <h3 style="margin: 0 0 15px 0; color: #333;">🔐 Your Client Portal Login</h3>
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${session.customer_email}</p>
                  <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 2px 8px; border-radius: 4px;">${tempPassword}</code></p>
                  <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Please change your password after first login.</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${SITE_URL}/client/login" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Access Client Portal</a>
                </div>
                
                <p style="font-size: 16px; line-height: 1.6; color: #333;">In your portal you can:</p>
                <ul style="color: #333; line-height: 1.8;">
                  <li>View your project status and timeline</li>
                  <li>Access and download deliverables</li>
                  <li>Message our team directly</li>
                  <li>View payment history</li>
                </ul>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br/>Eric Sattler<br/>NVISION FILMS LLC</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #999; text-align: center;">
                  NVISION FILMS LLC<br>
                  Professional Video Production Services<br>
                  <a href="${SITE_URL}" style="color: #667eea;">ineedfilming.com</a>
                </p>
              </div>
            </div>
          `,
        });
      }

      console.log('Booking, payment, client account, and project created successfully');
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create checkout session - Fixed empty description issue
router.post('/create-checkout-session', async (req: Request, res: Response) => {
  try {
    const { amount, customerEmail, customerName, metadata } = req.body;

    // Build product_data - only include description if it has content
    const productData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData.ProductData = {
      name: metadata?.bookingType || 'Video Production Service',
    };
    
    // Only add description if it exists and is not empty
    if (metadata?.projectDetails && metadata.projectDetails.trim()) {
      productData.description = metadata.projectDetails;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: productData,
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'https://ineedfilming.com'}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://ineedfilming.com'}/booking-portal`,
      customer_email: customerEmail,
      metadata: {
        ...metadata,
        customerName: customerName || metadata?.customerName || '',
        customerEmail: customerEmail || '',
      },
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
