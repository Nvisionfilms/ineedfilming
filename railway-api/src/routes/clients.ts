import { Router } from 'express';
import { pool } from '../index.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Get all clients (admin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, ca.company_name, ca.status, ca.storage_used_gb, ca.storage_limit_gb
       FROM users u
       LEFT JOIN client_accounts ca ON u.id = ca.user_id
       WHERE u.role = 'client'
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

export default router;
