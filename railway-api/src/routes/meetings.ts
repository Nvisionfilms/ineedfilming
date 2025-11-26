import { Router, Response } from 'express';
import { pool } from '../index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all meetings for current user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    // Get meetings where user is involved (either as client or admin can see all)
    const result = await pool.query(
      `SELECT m.* FROM meetings m
       LEFT JOIN client_accounts ca ON m.client_id = ca.id
       WHERE ca.user_id = $1 OR m.created_by = $1
       ORDER BY m.scheduled_at DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Create meeting
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title, description, scheduled_at, duration_minutes,
      meeting_link, client_id, booking_id, project_id
    } = req.body;

    const result = await pool.query(
      `INSERT INTO meetings (
        title, description, scheduled_at, duration_minutes,
        meeting_link, client_id, booking_id, project_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [title, description, scheduled_at, duration_minutes, meeting_link,
       client_id, booking_id, project_id, req.user?.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// Update meeting
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = Object.values(updates);
    
    const result = await pool.query(
      `UPDATE meetings SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

// Delete meeting
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM meetings WHERE id = $1', [id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

export default router;
