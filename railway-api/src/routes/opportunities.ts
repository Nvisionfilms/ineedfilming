import { Router, Response } from 'express';
import { pool } from '../index.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all opportunities (admin only)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM opportunities ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get opportunities error:', error);
    res.status(500).json({ error: 'Failed to fetch opportunities' });
  }
});

// Create opportunity
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const {
      contact_name, contact_email, contact_phone, company_name,
      project_type, budget_min, budget_max, timeline, stage,
      source, notes, priority
    } = req.body;

    const result = await pool.query(
      `INSERT INTO opportunities (
        contact_name, contact_email, contact_phone, company_name,
        project_type, budget_min, budget_max, timeline, stage,
        source, notes, priority, assigned_to
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [contact_name, contact_email, contact_phone, company_name,
       project_type, budget_min, budget_max, timeline, stage || 'lead',
       source, notes, priority || 'medium', req.user?.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create opportunity error:', error);
    res.status(500).json({ error: 'Failed to create opportunity' });
  }
});

// Update opportunity
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = Object.values(updates);
    
    const result = await pool.query(
      `UPDATE opportunities SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update opportunity error:', error);
    res.status(500).json({ error: 'Failed to update opportunity' });
  }
});

// Add activity to opportunity
router.post('/:id/activities', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { activity_type, description, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO opportunity_activities (
        opportunity_id, activity_type, description, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [id, activity_type, description, notes, req.user?.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Add activity error:', error);
    res.status(500).json({ error: 'Failed to add activity' });
  }
});

// Delete opportunity
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM opportunities WHERE id = $1', [id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete opportunity error:', error);
    res.status(500).json({ error: 'Failed to delete opportunity' });
  }
});

export default router;
