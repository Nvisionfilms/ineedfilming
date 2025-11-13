-- ============================================
-- AUTO-CREATE OPPORTUNITY WHEN BOOKING APPROVED
-- ============================================
-- This trigger automatically creates an opportunity in the pipeline
-- when a booking is approved or countered

CREATE OR REPLACE FUNCTION public.auto_create_opportunity_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only proceed if status changed to 'approved' or 'countered'
  IF (NEW.status IN ('approved', 'countered')) AND 
     (OLD.status IS NULL OR OLD.status NOT IN ('approved', 'countered')) THEN
    
    -- Check if opportunity already exists for this booking
    IF NOT EXISTS (
      SELECT 1 FROM public.opportunities 
      WHERE booking_id = NEW.id
    ) THEN
      -- Create opportunity
      INSERT INTO public.opportunities (
        booking_id,
        contact_name,
        contact_email,
        contact_phone,
        company,
        service_type,
        budget_min,
        budget_max,
        notes,
        stage,
        source,
        expected_close_date
      ) VALUES (
        NEW.id,
        NEW.client_name,
        NEW.client_email,
        NEW.client_phone,
        NEW.client_company,
        COALESCE(NEW.project_details, 'Video Production'),
        COALESCE(NEW.approved_price, NEW.counter_price, NEW.requested_price, 0),
        COALESCE(NEW.approved_price, NEW.counter_price, NEW.requested_price, 0),
        COALESCE(NEW.admin_notes, 'Auto-created from booking approval'),
        CASE 
          WHEN NEW.status = 'approved' THEN 'won'
          WHEN NEW.status = 'countered' THEN 'negotiation'
          ELSE 'qualified'
        END,
        'website',
        NEW.booking_date
      );
    ELSE
      -- Update existing opportunity stage
      UPDATE public.opportunities
      SET 
        stage = CASE 
          WHEN NEW.status = 'approved' THEN 'won'
          WHEN NEW.status = 'countered' THEN 'negotiation'
          ELSE stage
        END,
        budget_min = COALESCE(NEW.approved_price, NEW.counter_price, NEW.requested_price, budget_min),
        budget_max = COALESCE(NEW.approved_price, NEW.counter_price, NEW.requested_price, budget_max)
      WHERE booking_id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_create_opportunity ON public.custom_booking_requests;

-- Create trigger
CREATE TRIGGER trigger_auto_create_opportunity
AFTER INSERT OR UPDATE ON public.custom_booking_requests
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_opportunity_on_approval();

-- Add comment
COMMENT ON FUNCTION public.auto_create_opportunity_on_approval IS 
'Automatically creates or updates an opportunity in the pipeline when a booking is approved or countered';

-- ============================================
-- USAGE:
-- When a booking status changes to 'approved' or 'countered',
-- this trigger automatically:
-- 1. Creates an opportunity in the pipeline (if doesn't exist)
-- 2. Sets the stage to 'won' (approved) or 'negotiation' (countered)
-- 3. Populates all contact and budget information
-- 4. Links the opportunity to the booking
-- ============================================
