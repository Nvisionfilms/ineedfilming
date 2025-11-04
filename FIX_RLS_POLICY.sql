-- Fix RLS Policy for custom_booking_requests
-- This allows anonymous users to submit booking requests

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can submit custom booking requests" ON public.custom_booking_requests;
DROP POLICY IF EXISTS "Admins can view all booking requests" ON public.custom_booking_requests;
DROP POLICY IF EXISTS "Admins can update booking requests" ON public.custom_booking_requests;

-- Recreate INSERT policy for anonymous and authenticated users
CREATE POLICY "Anyone can submit custom booking requests"
ON public.custom_booking_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Recreate SELECT policy for admins only
CREATE POLICY "Admins can view all booking requests"
ON public.custom_booking_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Recreate UPDATE policy for admins only
CREATE POLICY "Admins can update booking requests"
ON public.custom_booking_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Verify RLS is enabled
ALTER TABLE public.custom_booking_requests ENABLE ROW LEVEL SECURITY;
