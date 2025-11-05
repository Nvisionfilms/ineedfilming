-- Fix RLS policies for client_accounts to allow admin access

-- Drop existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'client_accounts') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON client_accounts';
    END LOOP;
END $$;

-- Allow admins to view all client accounts
CREATE POLICY "Admins can view all client accounts"
ON client_accounts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to insert client accounts
CREATE POLICY "Admins can insert client accounts"
ON client_accounts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to update client accounts
CREATE POLICY "Admins can update client accounts"
ON client_accounts FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to delete client accounts
CREATE POLICY "Admins can delete client accounts"
ON client_accounts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow clients to view their own account
CREATE POLICY "Clients can view their own account"
ON client_accounts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Client accounts RLS policies updated successfully';
END $$;
