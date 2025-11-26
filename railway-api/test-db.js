// Simple connection test to Railway Postgres
import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Please export it before running this script.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function main() {
  console.log('Testing PostgreSQL connection...');
  console.log('Using DATABASE_URL:', DATABASE_URL.replace(/:[^:@]+@/, ':***@'));

  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connected. Server time:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
    console.error(err);
  } finally {
    await pool.end();
    console.log('🔌 Connection closed.');
  }
}

main();
