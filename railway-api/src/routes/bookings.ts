import { Router, Request, Response } from 'express';
import { pool } from '../index.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all bookings (admin only)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM bookings 
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
      `INSERT INTO bookings (
        client_name, client_email, client_phone, booking_type,
        booking_date, booking_time, requested_price, event_details, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING *`,
      [client_name, client_email, client_phone, booking_type, booking_date, booking_time, requested_price, event_details]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
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
      `UPDATE bookings SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
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
      `UPDATE bookings 
       SET status = 'approved', 
           approved_price = $2, 
           admin_notes = $3,
           approved_at = NOW(),
           updated_at = NOW()
       WHERE id = $1 
       RETURNING *`,
      [id, approved_price, admin_notes]
    );

    res.json(result.rows[0]);
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
      `UPDATE bookings 
       SET status = 'rejected', 
           admin_notes = $2,
           updated_at = NOW()
       WHERE id = $1 
       RETURNING *`,
      [id, admin_notes]
    );

    res.json(result.rows[0]);
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
      `UPDATE bookings 
       SET status = 'counter_offered', 
           approved_price = $2,
           admin_notes = $3,
           updated_at = NOW()
       WHERE id = $1 
       RETURNING *`,
      [id, counter_price, admin_notes]
    );

    res.json(result.rows[0]);
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
      `UPDATE bookings 
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
      `UPDATE bookings 
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
