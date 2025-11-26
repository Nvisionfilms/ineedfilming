import { Router } from 'express';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { pool } from '../index.js';
import { authenticate, AuthRequest, generateToken } from '../middleware/auth.js';

const router = Router();

// Enable MFA - Generate secret and QR code
router.post('/enable', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const email = req.user!.email;

    // Generate secret
    const secret = authenticator.generateSecret();

    // Generate OTP auth URL
    const otpauth = authenticator.keyuri(email, 'NVision Films', secret);

    // Generate QR code
    const qrCode = await QRCode.toDataURL(otpauth);

    // Store secret temporarily (not verified yet)
    await pool.query(
      'UPDATE users SET mfa_secret = $1, mfa_enabled = false WHERE id = $2',
      [secret, userId]
    );

    res.json({
      secret,
      qrCode,
      message: 'Scan QR code with your authenticator app, then verify with a code'
    });
  } catch (error) {
    console.error('MFA enable error:', error);
    res.status(500).json({ error: 'Failed to enable MFA' });
  }
});

// Verify MFA setup
router.post('/verify-setup', authenticate, async (req: AuthRequest, res) => {
  try {
    const { code } = req.body;
    const userId = req.user!.id;

    if (!code) {
      return res.status(400).json({ error: 'Verification code required' });
    }

    // Get user's MFA secret
    const result = await pool.query(
      'SELECT mfa_secret FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].mfa_secret) {
      return res.status(400).json({ error: 'MFA not initialized' });
    }

    const secret = result.rows[0].mfa_secret;

    // Verify the code
    const isValid = authenticator.verify({ token: code, secret });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Enable MFA
    await pool.query(
      'UPDATE users SET mfa_enabled = true WHERE id = $1',
      [userId]
    );

    // Log the action
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [userId, 'mfa_enabled', JSON.stringify({ timestamp: new Date() })]
    );

    res.json({ message: 'MFA successfully enabled' });
  } catch (error) {
    console.error('MFA verify setup error:', error);
    res.status(500).json({ error: 'Failed to verify MFA' });
  }
});

// Verify MFA code during login (called after password verification)
router.post('/verify-login', async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ error: 'User ID and code required' });
    }

    // Get user's MFA secret
    const result = await pool.query(
      'SELECT id, email, role, mfa_secret, mfa_enabled FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (!user.mfa_enabled || !user.mfa_secret) {
      return res.status(400).json({ error: 'MFA not enabled for this user' });
    }

    // Verify the code
    const isValid = authenticator.verify({ 
      token: code, 
      secret: user.mfa_secret 
    });

    if (!isValid) {
      // Log failed attempt
      await pool.query(
        'INSERT INTO failed_login_attempts (email, reason, ip_address) VALUES ($1, $2, $3)',
        [user.email, 'Invalid MFA code', req.ip]
      );
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('MFA verify login error:', error);
    res.status(500).json({ error: 'Failed to verify MFA code' });
  }
});

// Disable MFA
router.post('/disable', authenticate, async (req: AuthRequest, res) => {
  try {
    const { password } = req.body;
    const userId = req.user!.id;

    if (!password) {
      return res.status(400).json({ error: 'Password required to disable MFA' });
    }

    // Verify password
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];
    const bcrypt = await import('bcrypt');
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Disable MFA
    await pool.query(
      'UPDATE users SET mfa_enabled = false, mfa_secret = NULL WHERE id = $1',
      [userId]
    );

    // Log the action
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [userId, 'mfa_disabled', JSON.stringify({ timestamp: new Date() })]
    );

    res.json({ message: 'MFA successfully disabled' });
  } catch (error) {
    console.error('MFA disable error:', error);
    res.status(500).json({ error: 'Failed to disable MFA' });
  }
});

// Get MFA status
router.get('/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT mfa_enabled FROM users WHERE id = $1',
      [req.user!.id]
    );

    res.json({ 
      mfaEnabled: result.rows[0]?.mfa_enabled || false 
    });
  } catch (error) {
    console.error('MFA status error:', error);
    res.status(500).json({ error: 'Failed to get MFA status' });
  }
});

export default router;
