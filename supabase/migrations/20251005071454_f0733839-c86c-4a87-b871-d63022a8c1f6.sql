-- Add comprehensive input validation and rate limiting for booking submissions
-- This prevents spam and abuse while keeping the form public

-- Add rate limiting: Create function to check if email submitted recently
CREATE OR REPLACE FUNCTION public.check_recent_booking_submission(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.custom_booking_requests
    WHERE client_email = p_email
    AND created_at > NOW() - INTERVAL '5 minutes'
  );
$$;

-- Update INSERT policy to include rate limiting check
DROP POLICY IF EXISTS "Anyone can submit custom booking requests" ON public.custom_booking_requests;

CREATE POLICY "Rate-limited public booking submissions"
ON public.custom_booking_requests
FOR INSERT
WITH CHECK (
  -- Prevent spam: no submission from same email in last 5 minutes
  NOT public.check_recent_booking_submission(client_email)
  -- Basic validation: ensure required fields are not empty
  AND client_name IS NOT NULL 
  AND length(trim(client_name)) > 0
  AND client_email IS NOT NULL 
  AND length(trim(client_email)) > 0
  AND client_phone IS NOT NULL
  AND length(trim(client_phone)) > 0
);

-- Add UPDATE policy: Deny all UPDATE operations for regular users
-- Admin dashboard uses service role which bypasses RLS
CREATE POLICY "Deny all updates from regular users"
ON public.custom_booking_requests
FOR UPDATE
USING (false);

-- Add DELETE policy: Deny all DELETE operations for regular users
-- Admin dashboard uses service role which bypasses RLS
CREATE POLICY "Deny all deletes from regular users"
ON public.custom_booking_requests
FOR DELETE
USING (false);

-- Add comment explaining the security model
COMMENT ON TABLE public.custom_booking_requests IS 
'Security model: Public can INSERT (rate-limited), only service role (admin) can UPDATE/DELETE. SELECT limited to client email match.';