-- Add permanent delete capability for custom_booking_requests
-- This is for bookings that should be completely removed from the system
ALTER TABLE custom_booking_requests 
ADD COLUMN IF NOT EXISTS deleted_permanently BOOLEAN DEFAULT FALSE;

-- Add admin delete policy
CREATE POLICY "Admins can delete booking requests"
ON custom_booking_requests
FOR DELETE
USING (has_admin_role(auth.uid()));