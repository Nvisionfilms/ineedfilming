-- Add archived status to custom_booking_requests
-- This allows tracking bookings that went ghost/never moved forward
ALTER TABLE custom_booking_requests 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id) DEFAULT NULL;