-- Add booking_id to opportunities table to link back to bookings
ALTER TABLE public.opportunities
ADD COLUMN booking_id uuid REFERENCES public.custom_booking_requests(id);

-- Create index for better query performance
CREATE INDEX idx_opportunities_booking_id ON public.opportunities(booking_id);