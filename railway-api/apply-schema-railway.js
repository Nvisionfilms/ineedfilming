// Apply schema using Railway's connection
import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  connectionTimeoutMillis: 30000,
});

async function applySchema() {
  const client = await pool.connect();
  
  try {
    console.log('✅ Connected to database');
    const schema = fs.readFileSync('schema.sql', 'utf8');
    
    // Split by semicolons but keep multi-line statements together
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt) {
        try {
          await client.query(stmt);
          if ((i + 1) % 10 === 0) {
            console.log(`  Progress: ${i + 1}/${statements.length} statements`);
          }
        } catch (err) {
          console.error(`Error on statement ${i + 1}:`, stmt.substring(0, 100));
          throw err;
        }
      }
    }
    
    console.log('✅ Schema applied successfully!');
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    client.release();
    await pool.end();
    process.exit(1);
  }
}

applySchema();
