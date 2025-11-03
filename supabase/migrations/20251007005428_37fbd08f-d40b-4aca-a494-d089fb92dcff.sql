-- Fix foreign key constraint to allow booking deletion
-- Drop existing constraint
ALTER TABLE public.opportunities 
DROP CONSTRAINT IF EXISTS opportunities_booking_id_fkey;

-- Recreate constraint with ON DELETE SET NULL
-- This allows bookings to be deleted while preserving opportunities
ALTER TABLE public.opportunities 
ADD CONSTRAINT opportunities_booking_id_fkey 
FOREIGN KEY (booking_id) 
REFERENCES public.custom_booking_requests(id) 
ON DELETE SET NULL;

-- Also check if projects table has similar constraint
ALTER TABLE public.projects 
DROP CONSTRAINT IF EXISTS projects_booking_id_fkey;

ALTER TABLE public.projects 
ADD CONSTRAINT projects_booking_id_fkey 
FOREIGN KEY (booking_id) 
REFERENCES public.custom_booking_requests(id) 
ON DELETE SET NULL;

-- Same for client_accounts table
ALTER TABLE public.client_accounts 
DROP CONSTRAINT IF EXISTS client_accounts_booking_id_fkey;

ALTER TABLE public.client_accounts 
ADD CONSTRAINT client_accounts_booking_id_fkey 
FOREIGN KEY (booking_id) 
REFERENCES public.custom_booking_requests(id) 
ON DELETE SET NULL;