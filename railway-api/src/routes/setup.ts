import { Router } from 'express';
import { pool } from '../index.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// One-time setup endpoint - creates schema and admin account
router.post('/initialize', async (req, res) => {
  try {
    const { setupKey } = req.body;

    // Simple security check
    if (setupKey !== process.env.SETUP_KEY) {
      return res.status(403).json({ error: 'Invalid setup key' });
    }

    console.log('Starting database initialization...');

    // Read and apply schema
    const schemaPath = path.join(__dirname, '../../schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Applying schema...');
    await pool.query(schema);
    console.log('Schema applied successfully');

    // Create admin account with your credentials
    const email = 'da1unv45@gmail.com';
    const password = 'BookNvision2026';
    const fullName = 'Eric Sattler';

    console.log('Creating admin account...');
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, email_verified)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      [email, passwordHash, fullName, 'admin', true]
    );

    console.log('Admin account created');

    res.json({
      success: true,
      message: 'Database initialized successfully',
      admin: {
        email: 'da1unv45@gmail.com',
        password: 'BookNvision2026',
        note: 'You can now login with these credentials'
      }
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    res.status(500).json({
      error: 'Setup failed',
      message: error.message,
      details: error.stack
    });
  }
});

// Check if database is initialized
router.get('/status', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as initialized
    `);

    const adminCheck = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1',
      ['admin']
    );

    res.json({
      initialized: result.rows[0].initialized,
      adminExists: parseInt(adminCheck.rows[0].count) > 0
    });
  } catch (error: any) {
    res.json({
      initialized: false,
      adminExists: false,
      error: error.message
    });
  }
});

export default router;
