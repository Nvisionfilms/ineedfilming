-- Fix missing client_id column in projects table (CORRECTED)
-- Run this in Supabase SQL Editor

-- Add client_id column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES client_accounts(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);

-- Update existing projects to link to client accounts based on project_id
-- (client_accounts.project_id points to projects, so we reverse the relationship)
UPDATE projects p
SET client_id = ca.id
FROM client_accounts ca
WHERE ca.project_id = p.id
AND p.client_id IS NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully added client_id column to projects table and linked existing records';
END $$;
