-- Make client_id nullable in projects table
-- This allows creating projects without a client

-- The column already exists, but we need to ensure it's nullable
-- and doesn't have a NOT NULL constraint

-- Drop the existing foreign key constraint if it exists
ALTER TABLE projects 
DROP CONSTRAINT IF EXISTS projects_client_id_fkey;

-- Re-add the foreign key constraint as nullable (ON DELETE SET NULL)
ALTER TABLE projects 
ADD CONSTRAINT projects_client_id_fkey 
FOREIGN KEY (client_id) 
REFERENCES client_accounts(id) 
ON DELETE SET NULL;

-- Verify the column is nullable (this should already be the case)
ALTER TABLE projects 
ALTER COLUMN client_id DROP NOT NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'client_id column is now properly nullable';
END $$;
