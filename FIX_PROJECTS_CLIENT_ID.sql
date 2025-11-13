-- Fix missing client_id column in projects table
-- Run this in Supabase SQL Editor

-- Add client_id column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES client_accounts(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);

-- Update existing projects to link to client accounts based on booking_id
UPDATE projects p
SET client_id = ca.id
FROM client_accounts ca
WHERE p.booking_id = ca.booking_id
AND p.client_id IS NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully added client_id column to projects table';
END $$;
