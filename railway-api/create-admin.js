// Script to create admin account with your credentials
// Run this after deploying to Railway

import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function createAdmin() {
  try {
    console.log('Creating admin account...');

    const email = 'da1unv45@gmail.com';
    const password = 'BookNvision2026';
    const fullName = 'Eric Sattler';

    // Check if admin already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      console.log('❌ Admin account already exists with this email');
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, email_verified)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, role, created_at`,
      [email, passwordHash, fullName, 'admin', true]
    );

    const admin = result.rows[0];

    console.log('✅ Admin account created successfully!');
    console.log('');
    console.log('Admin Details:');
    console.log('  Email:', admin.email);
    console.log('  Name:', admin.full_name);
    console.log('  Role:', admin.role);
    console.log('  ID:', admin.id);
    console.log('  Created:', admin.created_at);
    console.log('');
    console.log('You can now login with:');
    console.log('  Email: da1unv45@gmail.com');
    console.log('  Password: BookNvision2026');
    console.log('');
    console.log('⚠️  IMPORTANT: Set up 2FA after your first login!');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    await pool.end();
    process.exit(1);
  }
}

createAdmin();
