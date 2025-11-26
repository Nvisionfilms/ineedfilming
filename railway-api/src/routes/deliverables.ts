import { Router, Response } from 'express';
import { pool } from '../index.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get deliverables (filtered by project if specified)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.query;
    
    let query = 'SELECT * FROM deliverables ORDER BY created_at DESC';
    let params: any[] = [];
    
    if (projectId) {
      query = 'SELECT * FROM deliverables WHERE project_id = $1 ORDER BY created_at DESC';
      params = [projectId];
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get deliverables error:', error);
    res.status(500).json({ error: 'Failed to fetch deliverables' });
  }
});

// Create deliverable
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      project_id, title, description, file_url, file_type,
      file_size, status, version
    } = req.body;

    const result = await pool.query(
      `INSERT INTO deliverables (
        project_id, title, description, file_url, file_type,
        file_size, status, version, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [project_id, title, description, file_url, file_type,
       file_size, status || 'pending', version || 1, req.user?.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create deliverable error:', error);
    res.status(500).json({ error: 'Failed to create deliverable' });
  }
});

// Update deliverable
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, title, description } = req.body;

    const result = await pool.query(
      `UPDATE deliverables 
       SET status = COALESCE($2, status),
           title = COALESCE($3, title),
           description = COALESCE($4, description),
           updated_at = NOW()
       WHERE id = $1 
       RETURNING *`,
      [id, status, title, description]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update deliverable error:', error);
    res.status(500).json({ error: 'Failed to update deliverable' });
  }
});

// Delete deliverable
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id} = req.params;

    await pool.query('DELETE FROM deliverables WHERE id = $1', [id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete deliverable error:', error);
    res.status(500).json({ error: 'Failed to delete deliverable' });
  }
});

export default router;
