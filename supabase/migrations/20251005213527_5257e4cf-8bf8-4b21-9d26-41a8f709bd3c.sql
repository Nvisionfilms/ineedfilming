
-- Update the status check constraint to include 'lead'
ALTER TABLE custom_booking_requests 
DROP CONSTRAINT IF EXISTS custom_booking_requests_status_check;

ALTER TABLE custom_booking_requests 
ADD CONSTRAINT custom_booking_requests_status_check 
CHECK (status IN ('pending', 'lead', 'approved', 'countered', 'rejected'));
