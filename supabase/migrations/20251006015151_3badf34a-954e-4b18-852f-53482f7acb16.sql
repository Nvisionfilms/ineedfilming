-- Add missing booking_id column to meetings table
ALTER TABLE public.meetings
ADD COLUMN booking_id uuid REFERENCES public.custom_booking_requests(id);