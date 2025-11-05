-- Fix RLS policies for custom_booking_requests to allow admin access

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all bookings" ON custom_booking_requests;
DROP POLICY IF EXISTS "Admins can manage bookings" ON custom_booking_requests;
DROP POLICY IF EXISTS "Admins can insert bookings" ON custom_booking_requests;
DROP POLICY IF EXISTS "Admins can update bookings" ON custom_booking_requests;
DROP POLICY IF EXISTS "Admins can delete bookings" ON custom_booking_requests;

-- Allow admins to view all bookings
CREATE POLICY "Admins can view all bookings"
ON custom_booking_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to insert bookings
CREATE POLICY "Admins can insert bookings"
ON custom_booking_requests FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to update bookings
CREATE POLICY "Admins can update bookings"
ON custom_booking_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to delete bookings
CREATE POLICY "Admins can delete bookings"
ON custom_booking_requests FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Booking RLS policies updated successfully';
END $$;
