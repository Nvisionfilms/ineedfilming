-- CRITICAL SECURITY FIX: Lock down opportunities table
-- Ensure RLS is enabled
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Admins can manage all opportunities" ON public.opportunities;

-- Recreate admin-only policies with explicit access control
-- Only admins can SELECT (view) opportunities
CREATE POLICY "Admins can view opportunities" 
ON public.opportunities 
FOR SELECT 
TO authenticated
USING (has_admin_role(auth.uid()));

-- Only admins can INSERT opportunities
CREATE POLICY "Admins can create opportunities" 
ON public.opportunities 
FOR INSERT 
TO authenticated
WITH CHECK (has_admin_role(auth.uid()));

-- Only admins can UPDATE opportunities
CREATE POLICY "Admins can update opportunities" 
ON public.opportunities 
FOR UPDATE 
TO authenticated
USING (has_admin_role(auth.uid()))
WITH CHECK (has_admin_role(auth.uid()));

-- Only admins can DELETE opportunities
CREATE POLICY "Admins can delete opportunities" 
ON public.opportunities 
FOR DELETE 
TO authenticated
USING (has_admin_role(auth.uid()));

-- Ensure no anonymous access (explicit denial)
-- This is redundant with RLS but adds defense in depth
CREATE POLICY "Deny all anonymous access to opportunities" 
ON public.opportunities 
FOR ALL
TO anon
USING (false);