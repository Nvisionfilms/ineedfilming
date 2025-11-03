-- Security hardening: Fix RLS policies to prevent data exposure

-- ============================================================================
-- FIX 1: Newsletter Subscribers Table
-- ============================================================================
-- Remove ineffective RESTRICTIVE blocking policies
DROP POLICY IF EXISTS "Block anonymous select on newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Block anonymous update on newsletter_subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Block anonymous delete on newsletter_subscribers" ON public.newsletter_subscribers;

-- Convert admin policy to PERMISSIVE (currently RESTRICTIVE which conflicts)
DROP POLICY IF EXISTS "Admins can view all subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can view all subscribers" 
ON public.newsletter_subscribers
FOR SELECT 
TO authenticated
USING (has_admin_role(auth.uid()));

-- Keep the insert policy as-is (allows newsletter signups)

-- ============================================================================
-- FIX 2: Profiles Table
-- ============================================================================
-- Remove ineffective RESTRICTIVE blocking policies
DROP POLICY IF EXISTS "Block anonymous select on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous update on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous delete on profiles" ON public.profiles;

-- Convert existing policies to PERMISSIVE for clarity
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles
FOR SELECT 
TO authenticated
USING (has_admin_role(auth.uid()));

-- Recreate update policies as PERMISSIVE
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" 
ON public.profiles
FOR UPDATE 
TO authenticated
USING (has_admin_role(auth.uid()))
WITH CHECK (has_admin_role(auth.uid()));

-- Keep insert policy as-is
-- Note: DELETE remains blocked (no policy = no access)