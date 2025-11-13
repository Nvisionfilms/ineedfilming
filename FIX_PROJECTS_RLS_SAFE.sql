-- Fix RLS policies for projects table (SAFE VERSION - can run multiple times)

-- Drop ALL existing policies first
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'projects') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON projects';
    END LOOP;
END $$;

-- Allow admins to view all projects
CREATE POLICY "Admins can view all projects"
ON projects FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to insert projects
CREATE POLICY "Admins can insert projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to update projects
CREATE POLICY "Admins can update projects"
ON projects FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to delete projects
CREATE POLICY "Admins can delete projects"
ON projects FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow clients to view their own projects
CREATE POLICY "Clients can view their projects"
ON projects FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM client_accounts
    WHERE user_id = auth.uid()
  )
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Projects RLS policies recreated successfully';
END $$;
