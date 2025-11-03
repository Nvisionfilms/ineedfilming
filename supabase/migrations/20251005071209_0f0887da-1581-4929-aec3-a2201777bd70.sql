-- Fix critical security vulnerability: Remove public access to all booking requests
-- This ensures clients can ONLY see their own booking requests, not everyone's data

DROP POLICY IF EXISTS "Clients can view their own requests" ON public.custom_booking_requests;

CREATE POLICY "Clients can view their own requests" 
ON public.custom_booking_requests
FOR SELECT
USING (
  client_email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text)
);

-- Note: Admin access via /admin/bookings uses service role key which bypasses RLS,
-- so this change only affects public/client access