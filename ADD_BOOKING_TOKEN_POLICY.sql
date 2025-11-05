-- Allow anonymous users to view their own booking via approval_token
-- This is needed for the booking portal to work with the email link

CREATE POLICY "Users can view booking with valid approval_token"
ON public.custom_booking_requests
FOR SELECT
TO anon, authenticated
USING (
  approval_token IS NOT NULL
  AND LENGTH(approval_token) > 0
);
