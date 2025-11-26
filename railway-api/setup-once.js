// One-time setup script to run on Railway
import pg from 'pg';
import bcrypt from 'bcrypt';
import fs from 'fs';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setup() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Connected to database');
    
    // Apply schema - execute as one transaction
    console.log('📋 Applying schema...');
    const schema = fs.readFileSync('schema.sql', 'utf8');
    
    // Remove the INSERT statement at the end - we'll create admin separately
    const schemaWithoutInsert = schema.replace(/-- Insert default admin user[\s\S]*$/m, '');
    
    await client.query(schemaWithoutInsert);
    
    console.log('✅ Schema applied');
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const email = 'da1unv45@gmail.com';
    const password = 'BookNvision2026';
    const passwordHash = await bcrypt.hash(password, 10);
    
    await client.query(
      `INSERT INTO users (email, password_hash, full_name, role, email_verified)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      [email, passwordHash, 'Eric Sattler', 'admin', true]
    );
    
    console.log('✅ Admin user created');
    console.log('');
    console.log('🎉 Setup complete!');
    console.log('');
    console.log('Login credentials:');
    console.log('  Email: da1unv45@gmail.com');
    console.log('  Password: BookNvision2026');
    console.log('');
    
    client.release();
    await pool.end();
    
    // Keep the process running so you can see the logs
    console.log('Keeping process alive for 60 seconds so you can see this message...');
    setTimeout(() => {
      console.log('Done! You can stop this service now.');
      process.exit(0);
    }, 60000);
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error(error.stack);
    client.release();
    await pool.end();
    process.exit(1);
  }
}

setup();
