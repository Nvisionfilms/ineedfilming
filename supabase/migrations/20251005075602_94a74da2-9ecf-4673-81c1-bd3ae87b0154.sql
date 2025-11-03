-- Drop the restrictive public insert policy since validation is handled in the edge function
DROP POLICY IF EXISTS "Rate-limited public booking submissions" ON public.custom_booking_requests;