-- Fix security warning: Replace the function with CASCADE
DROP FUNCTION IF EXISTS public.update_custom_booking_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_custom_booking_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_custom_booking_requests_updated_at
BEFORE UPDATE ON public.custom_booking_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_custom_booking_updated_at();