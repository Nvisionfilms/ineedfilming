-- Remove the insecure email-based SELECT policy that allows authenticated users
-- to potentially access booking requests that aren't theirs
DROP POLICY IF EXISTS "Authenticated users can view their own requests" ON custom_booking_requests;

-- The table already has proper access control:
-- 1. Admins can view all requests via "Admins can view all booking requests" policy
-- 2. Anonymous users submit bookings and receive a secure approval_token
-- 3. Users access their specific booking via the approval_token (not email matching)
-- 4. "Block anonymous select" prevents unauthenticated enumeration

-- This ensures:
-- - No email spoofing attacks possible
-- - Users can only access bookings via secure tokens
-- - Admins retain full access for management
-- - Anonymous submissions still work via INSERT policies