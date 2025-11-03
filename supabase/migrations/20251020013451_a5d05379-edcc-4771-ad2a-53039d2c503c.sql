-- Fix critical security vulnerabilities

-- 1. Restrict opportunities table to admin only (prevent lead stealing)
CREATE POLICY "Block public access to opportunities"
ON public.opportunities
FOR SELECT
USING (false);

-- 2. Restrict newsletter subscribers to admin only (prevent email harvesting)
DROP POLICY IF EXISTS "Admins can view all subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can view all subscribers"
ON public.newsletter_subscribers
FOR SELECT
USING (has_admin_role(auth.uid()));

CREATE POLICY "Block public access to newsletter subscribers"
ON public.newsletter_subscribers
FOR SELECT
USING (false);

-- 3. Add client access to payments (clients should see their own payments)
CREATE POLICY "Clients can view their own payments"
ON public.payments
FOR SELECT
USING (
  is_client(auth.uid()) AND (
    project_id = get_client_project_id(auth.uid()) OR
    booking_id IN (
      SELECT booking_id FROM public.client_accounts
      WHERE user_id = auth.uid() AND booking_id IS NOT NULL
    )
  )
);

-- 4. Add client access to contracts (clients should see their own contracts)
CREATE POLICY "Clients can view their own contracts"
ON public.contracts
FOR SELECT
USING (
  is_client(auth.uid()) AND (
    project_id = get_client_project_id(auth.uid()) OR
    booking_id IN (
      SELECT booking_id FROM public.client_accounts
      WHERE user_id = auth.uid() AND booking_id IS NOT NULL
    )
  )
);

-- 5. Explicitly block non-admin access to failed login attempts
CREATE POLICY "Block non-admin access to failed attempts"
ON public.failed_login_attempts
FOR SELECT
USING (false);

-- 6. Add explicit comment to custom_booking_requests about security
COMMENT ON POLICY "Block anonymous select on custom_booking_requests" ON public.custom_booking_requests IS 
'Blocks all anonymous SELECT access to protect customer data from unauthorized access';