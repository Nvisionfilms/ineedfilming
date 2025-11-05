-- Add booking_id column to client_accounts table

ALTER TABLE client_accounts 
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES custom_booking_requests(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_client_accounts_booking_id ON client_accounts(booking_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'booking_id column added to client_accounts table';
END $$;
