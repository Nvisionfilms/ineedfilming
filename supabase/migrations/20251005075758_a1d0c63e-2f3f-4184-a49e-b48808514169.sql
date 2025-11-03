-- Re-enable RLS with proper policy for anonymous submissions
ALTER TABLE public.custom_booking_requests ENABLE ROW LEVEL SECURITY;

-- Create policy allowing anonymous inserts (edge function uses anon key)
CREATE POLICY "Allow anonymous booking submissions"
ON public.custom_booking_requests
FOR INSERT
TO anon, public
WITH CHECK (true);