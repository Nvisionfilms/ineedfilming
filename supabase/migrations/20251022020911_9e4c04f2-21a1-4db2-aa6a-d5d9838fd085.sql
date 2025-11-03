-- Fix 1: Ensure admin_audit_log can only be written by triggers, not direct inserts
-- Add explicit policy to block all direct INSERT attempts
-- Audit logs should only be created via the log_admin_access() trigger function

CREATE POLICY "Audit logs can only be created by system triggers" 
ON public.admin_audit_log 
FOR INSERT 
WITH CHECK (false);

-- This ensures that:
-- 1. No user (including admins) can directly insert audit logs
-- 2. Only SECURITY DEFINER functions/triggers can insert (they bypass RLS)
-- 3. All audit entries are created through controlled, validated trigger functions


-- Fix 2: Explicitly document that newsletter_subscribers SELECT is admin-only
-- The existing "Admins can view all subscribers" policy is sufficient
-- With RLS enabled, lack of a policy for non-admins = access denied
-- Add a comment to make this explicit

COMMENT ON TABLE public.newsletter_subscribers IS 
'Newsletter subscriber data with RLS protection. Only admins can SELECT (read) subscriber data. Public can INSERT (subscribe) but cannot read the subscriber list, preventing email harvesting attacks.';