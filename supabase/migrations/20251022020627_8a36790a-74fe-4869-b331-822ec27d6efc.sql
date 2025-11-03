-- Remove the redundant false-returning policy
-- With RLS enabled, the admin-only SELECT policy is sufficient
DROP POLICY IF EXISTS "Block public access to newsletter subscribers" ON public.newsletter_subscribers;

-- The existing policies are sufficient:
-- "Admins can view all subscribers" (SELECT with has_admin_role check)
-- "Anyone can subscribe to newsletter" (INSERT with true - rate limited via edge function)

-- These policies ensure:
-- 1. Only admins can read subscriber data
-- 2. Anonymous users can submit subscriptions (handled safely via edge function with rate limiting)
-- 3. No UPDATE or DELETE operations are allowed (RLS blocks by default)