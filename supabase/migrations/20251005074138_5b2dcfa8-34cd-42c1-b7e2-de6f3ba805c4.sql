-- Phase 1: Fix PII Exposure in custom_booking_requests
-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Clients can view their own requests" ON public.custom_booking_requests;

-- Create new SELECT policy for admins to view all booking requests
CREATE POLICY "Admins can view all booking requests"
ON public.custom_booking_requests
FOR SELECT
TO authenticated
USING (public.has_admin_role(auth.uid()));

-- Create SELECT policy for authenticated users to view their own requests by email
CREATE POLICY "Authenticated users can view their own requests"
ON public.custom_booking_requests
FOR SELECT
TO authenticated
USING (client_email = auth.email());

-- Phase 2: Fix Profiles Table INSERT Policy
-- Add INSERT policy to allow authenticated users to create their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);