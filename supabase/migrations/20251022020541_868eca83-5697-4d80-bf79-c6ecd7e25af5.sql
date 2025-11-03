-- Remove the redundant false-returning policy
-- With RLS enabled, the admin-specific policies are sufficient
DROP POLICY IF EXISTS "Block public access to opportunities" ON public.opportunities;

-- The existing admin policies are sufficient:
-- "Admins can view opportunities" (SELECT with has_admin_role check)
-- "Admins can update opportunities" (UPDATE with has_admin_role check)
-- "Admins can create opportunities" (INSERT with has_admin_role check)
-- "Admins can delete opportunities" (DELETE with has_admin_role check)

-- These policies ensure that only authenticated admin users can access the opportunities table
-- Non-admins and unauthenticated users will be automatically blocked by RLS