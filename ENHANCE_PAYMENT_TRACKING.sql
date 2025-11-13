-- ============================================
-- ENHANCE PAYMENT TRACKING SYSTEM
-- ============================================
-- This script adds missing fields and logic for deposit + final payment workflow

-- 1. Add missing columns to payments table
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_checkout_url TEXT,
ADD COLUMN IF NOT EXISTS parent_payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_balance_payment BOOLEAN DEFAULT false;

-- 2. Add shoot_date and payment_deadline to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS shoot_date DATE,
ADD COLUMN IF NOT EXISTS final_payment_due_date DATE,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'deposit_paid', 'fully_paid', 'overdue'));

-- 3. Add payment tracking to custom_booking_requests
ALTER TABLE public.custom_booking_requests
ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS full_payment_received BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS full_payment_received_at TIMESTAMPTZ;

-- 4. Create index for due_date queries
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON public.payments(due_date);
CREATE INDEX IF NOT EXISTS idx_projects_shoot_date ON public.projects(shoot_date);
CREATE INDEX IF NOT EXISTS idx_projects_payment_status ON public.projects(payment_status);

-- 5. Function to calculate outstanding balance for a booking
CREATE OR REPLACE FUNCTION public.get_outstanding_balance(p_booking_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_price NUMERIC;
  v_total_paid NUMERIC;
BEGIN
  -- Get the approved/counter price from booking
  SELECT COALESCE(approved_price, counter_price, requested_price, 0)
  INTO v_total_price
  FROM public.custom_booking_requests
  WHERE id = p_booking_id;
  
  -- Get total paid amount
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_paid
  FROM public.payments
  WHERE booking_id = p_booking_id 
  AND status IN ('succeeded', 'paid');
  
  RETURN v_total_price - v_total_paid;
END;
$$;

-- 6. Function to automatically create final payment record when deposit is paid
CREATE OR REPLACE FUNCTION public.create_final_payment_on_deposit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_outstanding NUMERIC;
  v_project_id UUID;
  v_shoot_date DATE;
  v_due_date TIMESTAMPTZ;
BEGIN
  -- Only proceed if this is a deposit payment that just succeeded
  IF NEW.payment_type = 'deposit' AND NEW.status IN ('succeeded', 'paid') 
     AND (OLD.status IS NULL OR OLD.status NOT IN ('succeeded', 'paid')) THEN
    
    -- Calculate outstanding balance
    v_outstanding := public.get_outstanding_balance(NEW.booking_id);
    
    -- Get project and shoot date
    SELECT id, shoot_date 
    INTO v_project_id, v_shoot_date
    FROM public.projects
    WHERE booking_id = NEW.booking_id
    LIMIT 1;
    
    -- Set due date: 1 day before shoot date, or 30 days from now if no shoot date
    IF v_shoot_date IS NOT NULL THEN
      v_due_date := (v_shoot_date - INTERVAL '1 day')::TIMESTAMPTZ;
    ELSE
      v_due_date := NOW() + INTERVAL '30 days';
    END IF;
    
    -- Only create final payment if there's an outstanding balance
    IF v_outstanding > 0 THEN
      -- Check if final payment record already exists
      IF NOT EXISTS (
        SELECT 1 FROM public.payments 
        WHERE booking_id = NEW.booking_id 
        AND payment_type = 'final'
      ) THEN
        -- Create final payment record
        INSERT INTO public.payments (
          booking_id,
          project_id,
          client_id,
          amount,
          currency,
          status,
          payment_type,
          description,
          due_date,
          parent_payment_id,
          is_balance_payment
        ) VALUES (
          NEW.booking_id,
          v_project_id,
          NEW.client_id,
          v_outstanding,
          NEW.currency,
          'pending',
          'final',
          'Final payment - Balance due before editing begins',
          v_due_date,
          NEW.id,
          true
        );
        
        -- Update booking status
        UPDATE public.custom_booking_requests
        SET 
          deposit_paid = true,
          deposit_paid_at = NOW()
        WHERE id = NEW.booking_id;
        
        -- Update project payment status
        IF v_project_id IS NOT NULL THEN
          UPDATE public.projects
          SET 
            payment_status = 'deposit_paid',
            final_payment_due_date = v_due_date::DATE
          WHERE id = v_project_id;
        END IF;
      END IF;
    ELSE
      -- Full payment received
      UPDATE public.custom_booking_requests
      SET 
        deposit_paid = true,
        deposit_paid_at = NOW(),
        full_payment_received = true,
        full_payment_received_at = NOW()
      WHERE id = NEW.booking_id;
      
      IF v_project_id IS NOT NULL THEN
        UPDATE public.projects
        SET payment_status = 'fully_paid'
        WHERE id = v_project_id;
      END IF;
    END IF;
  END IF;
  
  -- If final payment is completed, update statuses
  IF NEW.payment_type = 'final' AND NEW.status IN ('succeeded', 'paid')
     AND (OLD.status IS NULL OR OLD.status NOT IN ('succeeded', 'paid')) THEN
    
    UPDATE public.custom_booking_requests
    SET 
      full_payment_received = true,
      full_payment_received_at = NOW()
    WHERE id = NEW.booking_id;
    
    UPDATE public.projects
    SET payment_status = 'fully_paid'
    WHERE booking_id = NEW.booking_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 7. Create trigger for automatic final payment creation
DROP TRIGGER IF EXISTS trigger_create_final_payment ON public.payments;
CREATE TRIGGER trigger_create_final_payment
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.create_final_payment_on_deposit();

-- 8. View to see payment summaries by booking
CREATE OR REPLACE VIEW public.payment_summary AS
SELECT 
  b.id AS booking_id,
  b.client_name,
  b.client_email,
  b.status AS booking_status,
  COALESCE(b.approved_price, b.counter_price, b.requested_price, 0) AS total_price,
  COALESCE(SUM(CASE WHEN p.status IN ('succeeded', 'paid') THEN p.amount ELSE 0 END), 0) AS total_paid,
  COALESCE(b.approved_price, b.counter_price, b.requested_price, 0) - 
    COALESCE(SUM(CASE WHEN p.status IN ('succeeded', 'paid') THEN p.amount ELSE 0 END), 0) AS outstanding_balance,
  b.deposit_paid,
  b.full_payment_received,
  proj.shoot_date,
  proj.final_payment_due_date,
  proj.payment_status AS project_payment_status,
  MAX(CASE WHEN p.payment_type = 'deposit' AND p.status IN ('succeeded', 'paid') THEN p.paid_at END) AS deposit_paid_date,
  MAX(CASE WHEN p.payment_type = 'final' AND p.status IN ('succeeded', 'paid') THEN p.paid_at END) AS final_paid_date,
  MAX(CASE WHEN p.payment_type = 'final' AND p.status = 'pending' THEN p.due_date END) AS final_payment_due
FROM public.custom_booking_requests b
LEFT JOIN public.payments p ON p.booking_id = b.id
LEFT JOIN public.projects proj ON proj.booking_id = b.id
WHERE b.status IN ('approved', 'countered')
  AND b.deleted_permanently IS NOT TRUE
GROUP BY 
  b.id, b.client_name, b.client_email, b.status, 
  b.approved_price, b.counter_price, b.requested_price,
  b.deposit_paid, b.full_payment_received,
  proj.shoot_date, proj.final_payment_due_date, proj.payment_status;

-- 9. Grant permissions
GRANT SELECT ON public.payment_summary TO authenticated;

-- 10. Comments for documentation
COMMENT ON COLUMN public.payments.due_date IS 'When this payment is due (for final payments, typically 1 day before shoot)';
COMMENT ON COLUMN public.payments.parent_payment_id IS 'Links final payment to original deposit payment';
COMMENT ON COLUMN public.payments.is_balance_payment IS 'True if this is an automatically generated balance payment';
COMMENT ON COLUMN public.projects.shoot_date IS 'Scheduled date for filming/production';
COMMENT ON COLUMN public.projects.final_payment_due_date IS 'Deadline for final payment (before editing begins)';
COMMENT ON COLUMN public.projects.payment_status IS 'Current payment status: pending, deposit_paid, fully_paid, overdue';

-- ============================================
-- USAGE NOTES:
-- ============================================
-- 1. When a deposit payment is marked as 'succeeded' or 'paid', the trigger automatically:
--    - Creates a 'final' payment record for the outstanding balance
--    - Sets due_date to 1 day before shoot_date (or 30 days if no shoot date)
--    - Updates booking.deposit_paid = true
--    - Updates project.payment_status = 'deposit_paid'
--
-- 2. When final payment is marked as 'succeeded' or 'paid':
--    - Updates booking.full_payment_received = true
--    - Updates project.payment_status = 'fully_paid'
--
-- 3. Use payment_summary view to see all payment statuses at a glance
--
-- 4. Admin should set project.shoot_date when scheduling the shoot
--    This will automatically update the final_payment_due_date
-- ============================================
