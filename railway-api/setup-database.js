// Setup Railway Database with Complete Schema (ESM)
import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function setupDatabase() {
  console.log('🚀 Connecting to Railway PostgreSQL...');
  console.log('📡 Using DATABASE_URL:', DATABASE_URL.replace(/:[^:@]+@/, ':***@'));

  try {
    const sqlFile = path.join(__dirname, 'COMPLETE_SUPABASE_SCHEMA.sql');
    const sql = await fs.readFile(sqlFile, 'utf8');

    console.log('📋 Executing full schema SQL in a single batch...');

    await pool.query('BEGIN');
    await pool.query(sql);
    await pool.query('COMMIT');

    console.log('✅ Schema applied successfully.');

    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log("\n📊 Tables present in 'public' schema:");
    for (const row of result.rows) {
      console.log('  ✓', row.table_name);
    }
    console.log(`\n🎉 Total: ${result.rows.length} tables.`);
  } catch (err) {
    console.error('❌ Error applying schema:', err.message);
    console.error(err);
    try {
      await pool.query('ROLLBACK');
    } catch {
      // ignore rollback failure
    }
  } finally {
    await pool.end();
    console.log('🔌 Connection closed.');
  }
}

setupDatabase();
