-- Add explicit RESTRICTIVE policies to block all anonymous SELECT access to sensitive customer data
-- This prevents any possibility of data scraping even if other policies are misconfigured

-- Block anonymous SELECT access to custom_booking_requests (customer contact info)
CREATE POLICY "Block anonymous select on custom_booking_requests"
ON public.custom_booking_requests
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- Block anonymous SELECT access to profiles (user emails and names)
CREATE POLICY "Block anonymous select on profiles"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- Block anonymous SELECT access to newsletter_subscribers (subscriber emails)
CREATE POLICY "Block anonymous select on newsletter_subscribers"
ON public.newsletter_subscribers
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);

-- Also block anonymous UPDATE/DELETE on newsletter_subscribers for extra protection
CREATE POLICY "Block anonymous update on newsletter_subscribers"
ON public.newsletter_subscribers
AS RESTRICTIVE
FOR UPDATE
TO anon
USING (false);

CREATE POLICY "Block anonymous delete on newsletter_subscribers"
ON public.newsletter_subscribers
AS RESTRICTIVE
FOR DELETE
TO anon
USING (false);

-- Block anonymous UPDATE on profiles (already can't delete, but ensure UPDATE is blocked)
CREATE POLICY "Block anonymous update on profiles"
ON public.profiles
AS RESTRICTIVE
FOR UPDATE
TO anon
USING (false);

CREATE POLICY "Block anonymous delete on profiles"
ON public.profiles
AS RESTRICTIVE
FOR DELETE
TO anon
USING (false);