import { Router, Request, Response } from 'express';
import { pool } from '../index.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { Resend } from 'resend';

const router = Router();
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const SITE_URL = process.env.SITE_URL || 'https://ineedfilming.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'da1unv45@gmail.com';
const ADMIN_CC = process.env.ADMIN_CC || ''; // Optional CC for admin notifications

// Email template helper
const emailWrapper = (content: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
    <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://static.wixstatic.com/media/e05d6c_796390cb4e7a447ebd2fa7dc927276c3~mv2.png/v1/fill/w_219,h_114,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/e05d6c_796390cb4e7a447ebd2fa7dc927276c3~mv2.png" alt="NVISION FILMS LLC" style="max-width: 150px; height: auto;" />
      </div>
      ${content}
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 12px; color: #999; text-align: center;">
        NVISION FILMS LLC<br>
        Professional Video Production Services<br>
        <a href="${SITE_URL}" style="color: #667eea;">ineedfilming.com</a>
      </p>
    </div>
  </div>
`;

// Format currency
const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

// Get all bookings (admin only)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM custom_booking_requests 
       WHERE archived_at IS NULL 
       AND (deleted_permanently IS NULL OR deleted_permanently = false)
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create booking
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      client_name, client_email, client_phone, booking_type,
      booking_date, booking_time, requested_price, event_details
    } = req.body;

    const result = await pool.query(
      `INSERT INTO custom_booking_requests (
        client_name, client_email, client_phone, booking_type,
        booking_date, booking_time, requested_price, event_details, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING *`,
      [client_name, client_email, client_phone, booking_type, booking_date, booking_time, requested_price, event_details]
    );

    const booking = result.rows[0];

    // Send confirmation email to client
    if (resend && client_email) {
      await resend.emails.send({
        from: 'NVISION FILMS LLC <contact@nvisionfilms.com>',
        to: [client_email],
        subject: 'Booking Request Received - NVISION FILMS',
        html: emailWrapper(`
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Booking Request Received!</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Hi ${client_name},</p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Thank you for your booking request! We've received your inquiry and will review it shortly.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Booking Details:</h3>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(booking_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${booking_time}</p>
            <p style="margin: 5px 0;"><strong>Service:</strong> ${booking_type || 'Video Production'}</p>
            <p style="margin: 5px 0;"><strong>Your Budget:</strong> ${formatCurrency(requested_price)}</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">We'll be in touch within 24-48 hours with our response. If you have any questions, feel free to reply to this email.</p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br/>Eric Sattler<br/>NVISION FILMS LLC</p>
        `),
      });

      // Send notification to admin (with optional CC)
      const adminTo = [ADMIN_EMAIL];
      if (ADMIN_CC) adminTo.push(ADMIN_CC);
      
      await resend.emails.send({
        from: 'NVISION FILMS LLC <contact@nvisionfilms.com>',
        to: adminTo,
        subject: `🎬 New Booking Request from ${client_name}`,
        html: emailWrapper(`
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">New Booking Request!</h1>
          
          <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Client Information:</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${client_name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${client_email}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${client_phone || 'Not provided'}</p>
          </div>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Booking Details:</h3>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(booking_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${booking_time}</p>
            <p style="margin: 5px 0;"><strong>Service:</strong> ${booking_type || 'Video Production'}</p>
            <p style="margin: 5px 0;"><strong>Requested Price:</strong> ${formatCurrency(requested_price)}</p>
            ${event_details ? `<p style="margin: 15px 0 5px 0;"><strong>Details:</strong></p><p style="margin: 5px 0; white-space: pre-wrap;">${event_details}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${SITE_URL}/admin/bookings" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review in Admin Panel</a>
          </div>
        `),
      });
    }

    res.json(booking);
  } catch (error: any) {
    console.error('Create booking error:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ 
      error: 'Failed to create booking',
      details: error.message 
    });
  }
});

// Update booking
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = Object.values(updates);
    
    const result = await pool.query(
      `UPDATE custom_booking_requests SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Approve booking
router.post('/:id/approve', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { approved_price, admin_notes } = req.body;

    const result = await pool.query(
      `UPDATE custom_booking_requests 
       SET status = 'approved', 
           approved_price = $2, 
           admin_notes = $3,
           approved_at = NOW(),
           updated_at = NOW()
       WHERE id = $1 
       RETURNING *`,
      [id, approved_price, admin_notes]
    );

    const booking = result.rows[0];
    const depositAmount = Math.round(approved_price * 0.5 * 100) / 100; // 50% deposit

    // Send approval email with payment link
    if (resend && booking.client_email) {
      await resend.emails.send({
        from: 'NVISION FILMS LLC <contact@nvisionfilms.com>',
        to: [booking.client_email],
        subject: '✅ Your Booking Has Been Approved! - NVISION FILMS',
        html: emailWrapper(`
          <h1 style="color: #22c55e; font-size: 24px; margin-bottom: 20px;">🎉 Great News - You're Approved!</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Hi ${booking.client_name},</p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">We're excited to confirm that your booking request has been approved!</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
            <h3 style="margin: 0 0 15px 0; color: #333;">📋 Invoice Summary</h3>
            <p style="margin: 5px 0;"><strong>Service Date:</strong> ${new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${booking.booking_time}</p>
            <hr style="border: none; border-top: 1px solid #d1fae5; margin: 15px 0;">
            <p style="margin: 5px 0; font-size: 18px;"><strong>Total Project Cost:</strong> ${formatCurrency(approved_price)}</p>
            <p style="margin: 5px 0; color: #16a34a;"><strong>Deposit Required (50%):</strong> ${formatCurrency(depositAmount)}</p>
            <p style="margin: 5px 0; color: #666;"><em>Remaining balance due on shoot day</em></p>
          </div>
          
          ${admin_notes ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;"><p style="margin: 0; color: #666;"><strong>Note from our team:</strong> ${admin_notes}</p></div>` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${SITE_URL}/pay/${booking.id}" style="display: inline-block; background: #22c55e; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Pay Deposit Now</a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center;">Secure payment powered by Stripe</p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br/>Eric Sattler<br/>NVISION FILMS LLC</p>
        `),
      });
    }

    res.json(booking);
  } catch (error) {
    console.error('Approve booking error:', error);
    res.status(500).json({ error: 'Failed to approve booking' });
  }
});

// Reject booking
router.post('/:id/reject', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const result = await pool.query(
      `UPDATE custom_booking_requests 
       SET status = 'rejected', 
           admin_notes = $2,
           updated_at = NOW()
       WHERE id = $1 
       RETURNING *`,
      [id, admin_notes]
    );

    const booking = result.rows[0];

    // Send rejection email
    if (resend && booking.client_email) {
      await resend.emails.send({
        from: 'NVISION FILMS LLC <contact@nvisionfilms.com>',
        to: [booking.client_email],
        subject: 'Update on Your Booking Request - NVISION FILMS',
        html: emailWrapper(`
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Booking Update</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Hi ${booking.client_name},</p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Thank you for your interest in working with NVISION FILMS. After reviewing your request, we're unfortunately unable to accommodate this booking at this time.</p>
          
          ${admin_notes ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;"><p style="margin: 0; color: #666;"><strong>Note from our team:</strong> ${admin_notes}</p></div>` : ''}
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">We'd love to work with you in the future! Feel free to reach out for different dates or project requirements.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${SITE_URL}/book" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Submit New Request</a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br/>Eric Sattler<br/>NVISION FILMS LLC</p>
        `),
      });
    }

    res.json(booking);
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({ error: 'Failed to reject booking' });
  }
});

// Counter offer
router.post('/:id/counter', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { counter_price, admin_notes } = req.body;

    const result = await pool.query(
      `UPDATE custom_booking_requests 
       SET status = 'counter_offered', 
           approved_price = $2,
           admin_notes = $3,
           updated_at = NOW()
       WHERE id = $1 
       RETURNING *`,
      [id, counter_price, admin_notes]
    );

    const booking = result.rows[0];
    const depositAmount = Math.round(counter_price * 0.5 * 100) / 100; // 50% deposit
    const balanceAmount = counter_price - depositAmount;

    // Send counter offer email with custom invoice
    if (resend && booking.client_email) {
      await resend.emails.send({
        from: 'NVISION FILMS LLC <contact@nvisionfilms.com>',
        to: [booking.client_email],
        subject: '💬 Counter Offer for Your Booking - NVISION FILMS',
        html: emailWrapper(`
          <h1 style="color: #f59e0b; font-size: 24px; margin-bottom: 20px;">📝 We Have a Counter Offer!</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Hi ${booking.client_name},</p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Thank you for your booking request! After reviewing your project details, we'd like to propose the following adjusted pricing:</p>
          
          <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin: 0 0 15px 0; color: #333;">📋 Custom Invoice</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #fde68a;">Service Date:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #fde68a; text-align: right;">${new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #fde68a;">Time:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #fde68a; text-align: right;">${booking.booking_time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #fde68a; color: #666;"><s>Your Original Request:</s></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #fde68a; text-align: right; color: #666;"><s>${formatCurrency(booking.requested_price)}</s></td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-size: 18px; font-weight: bold; color: #d97706;">Our Counter Offer:</td>
                <td style="padding: 12px 0; font-size: 18px; font-weight: bold; text-align: right; color: #d97706;">${formatCurrency(counter_price)}</td>
              </tr>
            </table>
            
            <hr style="border: none; border-top: 2px solid #fde68a; margin: 15px 0;">
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 0; color: #16a34a;"><strong>Deposit (50%):</strong></td>
                <td style="padding: 5px 0; text-align: right; color: #16a34a; font-weight: bold;">${formatCurrency(depositAmount)}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #666;">Balance (due on shoot day):</td>
                <td style="padding: 5px 0; text-align: right; color: #666;">${formatCurrency(balanceAmount)}</td>
              </tr>
            </table>
          </div>
          
          ${admin_notes ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;"><p style="margin: 0; color: #666;"><strong>Why this price?</strong> ${admin_notes}</p></div>` : ''}
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">If this works for you, click below to accept and pay your deposit. If you'd like to discuss further, simply reply to this email!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${SITE_URL}/booking-portal?booking=${booking.id}&action=accept-counter&amount=${depositAmount}" style="display: inline-block; background: #f59e0b; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Accept & Pay Deposit</a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center;">Secure payment powered by Stripe</p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br/>Eric Sattler<br/>NVISION FILMS LLC</p>
        `),
      });
    }

    res.json(booking);
  } catch (error) {
    console.error('Counter offer error:', error);
    res.status(500).json({ error: 'Failed to create counter offer' });
  }
});

// Archive booking
router.post('/:id/archive', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE custom_booking_requests 
       SET archived_at = NOW(), updated_at = NOW()
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Archive booking error:', error);
    res.status(500).json({ error: 'Failed to archive booking' });
  }
});

// Delete booking
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE custom_booking_requests 
       SET deleted_permanently = true, updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

export default router;
