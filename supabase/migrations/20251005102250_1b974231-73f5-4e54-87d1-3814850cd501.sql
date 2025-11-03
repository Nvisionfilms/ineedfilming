-- Phase 1: Complete Audit Logging System

-- Create admin_audit_log table (append-only audit trail)
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email text,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  reason text,
  accessed_at timestamptz DEFAULT now(),
  ip_address text
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (has_admin_role(auth.uid()));

-- Audit logs are append-only (no updates or deletes)
CREATE POLICY "Audit logs are append-only"
ON public.admin_audit_log
FOR UPDATE
USING (false);

CREATE POLICY "Audit logs cannot be deleted"
ON public.admin_audit_log
FOR DELETE
USING (false);

-- Create failed_login_attempts table
CREATE TABLE public.failed_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  reason text,
  ip_address text,
  attempted_at timestamptz DEFAULT now()
);

ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Only service role can log failed attempts
CREATE POLICY "Service role can log failed attempts"
ON public.failed_login_attempts
FOR INSERT
TO service_role
WITH CHECK (true);

-- Admins can view failed login attempts
CREATE POLICY "Admins can view failed attempts"
ON public.failed_login_attempts
FOR SELECT
TO authenticated
USING (has_admin_role(auth.uid()));

-- Function to check if account is locked (5 failed attempts in 15 minutes)
CREATE OR REPLACE FUNCTION public.is_account_locked(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) >= 5
  FROM public.failed_login_attempts
  WHERE email = p_email
  AND attempted_at > NOW() - INTERVAL '15 minutes';
$$;

-- Cleanup function for old failed attempts (24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_failed_attempts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.failed_login_attempts
  WHERE attempted_at < NOW() - INTERVAL '24 hours';
$$;

-- Function to log admin access to sensitive data
CREATE OR REPLACE FUNCTION public.log_admin_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if the user is an admin
  IF has_admin_role(auth.uid()) THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      admin_email,
      action,
      table_name,
      record_id
    ) VALUES (
      auth.uid(),
      auth.email(),
      TG_OP,
      TG_TABLE_NAME,
      CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.id
        ELSE NEW.id
      END
    );
  END IF;
  
  RETURN CASE 
    WHEN TG_OP = 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$;

-- Add triggers to all sensitive tables
CREATE TRIGGER log_custom_booking_access
AFTER UPDATE OR DELETE ON public.custom_booking_requests
FOR EACH ROW EXECUTE FUNCTION public.log_admin_access();

CREATE TRIGGER log_newsletter_access
AFTER UPDATE OR DELETE ON public.newsletter_subscribers
FOR EACH ROW EXECUTE FUNCTION public.log_admin_access();

CREATE TRIGGER log_payment_access
AFTER UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.log_admin_access();

CREATE TRIGGER log_contract_access
AFTER UPDATE OR DELETE ON public.contracts
FOR EACH ROW EXECUTE FUNCTION public.log_admin_access();

CREATE TRIGGER log_opportunity_access
AFTER UPDATE OR DELETE ON public.opportunities
FOR EACH ROW EXECUTE FUNCTION public.log_admin_access();