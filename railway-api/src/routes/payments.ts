import { Router, Response } from 'express';
import { pool } from '../index.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all payments or by booking ID
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.query;
    
    let query = 'SELECT * FROM payments ORDER BY created_at DESC';
    let params: any[] = [];
    
    if (bookingId) {
      query = 'SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC';
      params = [bookingId];
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Create payment
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      booking_id, amount, status, payment_type, payment_method,
      stripe_payment_intent_id, stripe_checkout_session_id, description
    } = req.body;

    const result = await pool.query(
      `INSERT INTO payments (
        booking_id, amount, status, payment_type, payment_method,
        stripe_payment_intent_id, stripe_checkout_session_id, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [booking_id, amount, status, payment_type, payment_method, 
       stripe_payment_intent_id, stripe_checkout_session_id, description]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Update payment
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, amount, description } = req.body;

    const result = await pool.query(
      `UPDATE payments 
       SET status = COALESCE($2, status),
           amount = COALESCE($3, amount),
           description = COALESCE($4, description),
           updated_at = NOW()
       WHERE id = $1 
       RETURNING *`,
      [id, status, amount, description]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

export default router;
