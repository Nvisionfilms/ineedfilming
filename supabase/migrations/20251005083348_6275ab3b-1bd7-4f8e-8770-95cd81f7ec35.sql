-- Add soft delete columns to custom_booking_requests
ALTER TABLE public.custom_booking_requests
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN deleted_by UUID;

-- Add index for faster filtering
CREATE INDEX idx_custom_booking_requests_deleted_at 
ON public.custom_booking_requests(deleted_at);