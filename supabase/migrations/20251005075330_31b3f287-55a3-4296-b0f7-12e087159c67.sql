-- Allow anonymous users to insert custom booking requests
CREATE POLICY "Allow anonymous custom booking submissions"
ON public.custom_booking_requests
FOR INSERT
TO anon
WITH CHECK (true);