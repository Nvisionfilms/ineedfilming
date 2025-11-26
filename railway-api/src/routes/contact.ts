import { Router } from 'express';
import { pool } from '../index.js';
import { z } from 'zod';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(1),
  service: z.string().optional(),
});

// Submit contact form
router.post('/submit', async (req, res) => {
  try {
    const data = contactSchema.parse(req.body);

    // Store in database
    await pool.query(
      `INSERT INTO contact_submissions (name, email, phone, message, service, submitted_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [data.name, data.email, data.phone || null, data.message, data.service || null]
    );

    // TODO: Send notification email via Resend
    // if (resend) {
    //   await resend.emails.send({
    //     from: 'contact@nvisionfilms.com',
    //     to: 'da1unv45@gmail.com',
    //     subject: `New Contact Form Submission from ${data.name}`,
    //     html: `
    //       <h2>New Contact Form Submission</h2>
    //       <p><strong>Name:</strong> ${data.name}</p>
    //       <p><strong>Email:</strong> ${data.email}</p>
    //       <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
    //       <p><strong>Service:</strong> ${data.service || 'N/A'}</p>
    //       <p><strong>Message:</strong></p>
    //       <p>${data.message}</p>
    //     `
    //   });
    // }

    res.json({ message: 'Contact form submitted successfully' });
  } catch (error: any) {
    console.error('Contact form error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid form data' });
    }
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

export default router;
