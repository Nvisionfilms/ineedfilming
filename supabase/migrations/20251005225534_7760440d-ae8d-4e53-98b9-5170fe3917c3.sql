-- Fix opportunities table RLS policies to properly restrict to admins only
-- The current "Deny all anonymous access" policy with false is too restrictive
-- and could block legitimate admin access

-- Remove the conflicting blanket denial policy
DROP POLICY IF EXISTS "Deny all anonymous access to opportunities" ON opportunities;

-- Drop and recreate the admin policies to ensure they're properly permissive
DROP POLICY IF EXISTS "Admins can view opportunities" ON opportunities;
DROP POLICY IF EXISTS "Admins can create opportunities" ON opportunities;
DROP POLICY IF EXISTS "Admins can update opportunities" ON opportunities;
DROP POLICY IF EXISTS "Admins can delete opportunities" ON opportunities;

-- Create permissive policies that allow ONLY admins to access opportunities
-- Using PERMISSIVE (default) means if any policy grants access, the operation succeeds

CREATE POLICY "Admins can view opportunities"
ON opportunities
FOR SELECT
TO authenticated
USING (has_admin_role(auth.uid()));

CREATE POLICY "Admins can create opportunities"
ON opportunities
FOR INSERT
TO authenticated
WITH CHECK (has_admin_role(auth.uid()));

CREATE POLICY "Admins can update opportunities"
ON opportunities
FOR UPDATE
TO authenticated
USING (has_admin_role(auth.uid()))
WITH CHECK (has_admin_role(auth.uid()));

CREATE POLICY "Admins can delete opportunities"
ON opportunities
FOR DELETE
TO authenticated
USING (has_admin_role(auth.uid()));

-- With RLS enabled and only these policies, the result is:
-- ✅ Admins (authenticated users with admin role) have full CRUD access
-- ✅ Non-admin authenticated users are blocked (no policies grant them access)
-- ✅ Anonymous users are blocked (policies require authentication)
-- ✅ No way for client accounts or compromised accounts to access sales leads