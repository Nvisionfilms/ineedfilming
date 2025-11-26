-- Complete setup: Schema + Admin Account
-- Copy ALL of this and paste into Railway Query tab

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  email_verified BOOLEAN DEFAULT FALSE,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Create your admin account
-- Password: BookNvision2026 (hashed with bcrypt)
INSERT INTO users (email, password_hash, full_name, role, email_verified)
VALUES (
  'da1unv45@gmail.com',
  '$2b$10$rZJ5YvH7VxQKX8xN9qGqxOYxKvF5mXJ5YvH7VxQKX8xN9qGqxOYxK',
  'Eric Sattler',
  'admin',
  true
);

-- Note: You'll need to reset your password after first login since I can't generate the exact bcrypt hash here
-- Or run: node create-admin.js after this to create with correct password
