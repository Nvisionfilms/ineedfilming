-- Drop the existing foreign key constraint
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_booking_id_fkey;

-- Recreate the foreign key with CASCADE DELETE
-- This means when a booking is deleted, all associated payments are also deleted
ALTER TABLE payments
ADD CONSTRAINT payments_booking_id_fkey 
FOREIGN KEY (booking_id) 
REFERENCES custom_booking_requests(id) 
ON DELETE CASCADE;