// Setup script to apply database schema
import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  try {
    console.log('🔄 Connecting to Railway PostgreSQL...');
    
    // Test connection
    const testResult = await pool.query('SELECT NOW()');
    console.log('✅ Connected to database at:', testResult.rows[0].now);
    console.log('');

    // Read schema file
    console.log('📖 Reading schema.sql...');
    const schema = fs.readFileSync('schema.sql', 'utf8');
    
    // Apply schema
    console.log('🔄 Applying database schema...');
    await pool.query(schema);
    
    console.log('✅ Database schema applied successfully!');
    console.log('');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('✅ Created tables:');
    tablesResult.rows.forEach(row => {
      console.log('  ✓', row.table_name);
    });
    console.log('');
    console.log('🎉 Database setup complete!');
    console.log('');
    console.log('Next step: Run "node create-admin.js" to create your admin account');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.error('');
    console.error('Full error:', error);
    await pool.end();
    process.exit(1);
  }
}

setupDatabase();
