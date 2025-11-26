import { Router, Response } from 'express';
import { pool } from '../index.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import bcrypt from 'bcrypt';

const router = Router();

// Get all clients (admin only)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        ca.id,
        ca.user_id,
        ca.project_id,
        ca.booking_id,
        ca.company_name,
        ca.status,
        ca.storage_limit_gb,
        ca.storage_used_gb,
        ca.created_at,
        u.email,
        u.full_name,
        p.project_name as project_name
       FROM client_accounts ca
       JOIN users u ON ca.user_id = u.id
       LEFT JOIN projects p ON ca.project_id = p.id
       ORDER BY ca.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Search clients by email or name
router.get('/search', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query;
    
    const result = await pool.query(
      `SELECT 
        ca.id,
        ca.user_id,
        ca.project_id,
        ca.booking_id,
        ca.company_name,
        ca.status,
        ca.storage_limit_gb,
        ca.storage_used_gb,
        ca.created_at,
        u.email,
        u.full_name,
        p.title as project_name
       FROM client_accounts ca
       JOIN users u ON ca.user_id = u.id
       LEFT JOIN projects p ON ca.project_id = p.id
       WHERE u.email ILIKE $1 OR u.full_name ILIKE $1
       ORDER BY ca.created_at DESC`,
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Search clients error:', error);
    res.status(500).json({ error: 'Failed to search clients' });
  }
});

// Create client account
router.post('/create', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, full_name, company_name, project_id, booking_id } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'client')
       RETURNING id`,
      [email, hashedPassword, full_name]
    );

    const userId = userResult.rows[0].id;

    // Create client account
    const clientResult = await pool.query(
      `INSERT INTO client_accounts (user_id, company_name, project_id, booking_id, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING *`,
      [userId, company_name, project_id, booking_id]
    );

    res.json({ user_id: userId, client: clientResult.rows[0] });
  } catch (error: any) {
    console.error('Create client error:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create client' });
    }
  }
});

// Update client
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { full_name, company_name, storage_limit_gb, status, project_id } = req.body;

    // Update client account
    if (company_name !== undefined || storage_limit_gb !== undefined || status !== undefined || project_id !== undefined) {
      await pool.query(
        `UPDATE client_accounts 
         SET company_name = COALESCE($2, company_name),
             storage_limit_gb = COALESCE($3, storage_limit_gb),
             status = COALESCE($4, status),
             project_id = COALESCE($5, project_id)
         WHERE id = $1`,
        [id, company_name, storage_limit_gb, status, project_id]
      );
    }

    // Update user profile if full_name provided
    if (full_name !== undefined) {
      const clientResult = await pool.query('SELECT user_id FROM client_accounts WHERE id = $1', [id]);
      if (clientResult.rows.length > 0) {
        await pool.query(
          'UPDATE users SET full_name = $1 WHERE id = $2',
          [full_name, clientResult.rows[0].user_id]
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// Delete client
router.delete('/:userId', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Delete client account (cascade will handle related records)
    await pool.query('DELETE FROM client_accounts WHERE user_id = $1', [userId]);
    
    // Delete user
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

export default router;
