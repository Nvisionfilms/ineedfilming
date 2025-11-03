-- Add admin update policy for custom_booking_requests
-- This allows admins to archive bookings and update fields
CREATE POLICY "Admins can update booking requests"
ON custom_booking_requests
FOR UPDATE
USING (has_admin_role(auth.uid()))
WITH CHECK (has_admin_role(auth.uid()));