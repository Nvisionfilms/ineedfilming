import { Router } from 'express';
import { pool } from '../index.js';
import { Resend } from 'resend';
import { z } from 'zod';

const router = Router();
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
  try {
    const { email, name } = subscribeSchema.parse(req.body);

    // Check if already subscribed
    const existing = await pool.query(
      'SELECT id, subscribed FROM newsletter_subscribers WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      const subscriber = existing.rows[0];
      
      if (subscriber.subscribed) {
        return res.status(400).json({ error: 'Email already subscribed' });
      }

      // Resubscribe
      await pool.query(
        'UPDATE newsletter_subscribers SET subscribed = true, unsubscribed_at = NULL WHERE id = $1',
        [subscriber.id]
      );
    } else {
      // New subscriber
      await pool.query(
        'INSERT INTO newsletter_subscribers (email, name) VALUES ($1, $2)',
        [email, name || null]
      );
    }

    // Send welcome email (if Resend is configured)
    if (resend) {
      await resend.emails.send({
      from: "NVISION FILMS LLC <contact@nvisionfilms.com>",
      to: [email],
      subject: "Welcome to NVISION FILMS LLC",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://static.wixstatic.com/media/e05d6c_796390cb4e7a447ebd2fa7dc927276c3~mv2.png/v1/fill/w_219,h_114,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/e05d6c_796390cb4e7a447ebd2fa7dc927276c3~mv2.png" alt="NVISION FILMS LLC" style="max-width: 180px; height: auto;" />
          </div>
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Welcome to NVISION FILMS LLC!</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">${name ? `Hi ${name},` : 'Hi there,'}</p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Thank you for subscribing to our newsletter. We're excited to share updates, project showcases, and exclusive insights with you.</p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Stay tuned for our next update!</p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">Best regards,<br/>Eric Sattler<br/>NVISION FILMS LLC</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            NVISION FILMS LLC<br>
            If you wish to unsubscribe, reply to this email.
          </p>
        </div>
      `,
      });
    }

    res.json({ message: 'Successfully subscribed to newsletter' });
  } catch (error: any) {
    console.error('Newsletter subscribe error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

export default router;
