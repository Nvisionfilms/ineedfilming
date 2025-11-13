-- ============================================
-- AUTO-CREATE CLIENT ACCOUNT ON PAYMENT (V2 - FIXED)
-- ============================================
-- Simplified version that creates client records
-- Auth user creation handled separately via Edge Function

-- ============================================
-- STEP 1: Create pending_client_accounts table
-- ============================================
CREATE TABLE IF NOT EXISTS public.pending_client_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.custom_booking_requests(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id),
  client_email TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_company TEXT,
  status TEXT DEFAULT 'pending_auth_creation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.pending_client_accounts ENABLE ROW LEVEL SECURITY;

-- Admin can see all (using user_roles table instead of profiles)
CREATE POLICY "Admins can manage pending clients"
ON public.pending_client_accounts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- STEP 2: Function to queue client creation
-- ============================================
CREATE OR REPLACE FUNCTION public.queue_client_creation_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  -- Only proceed if this is a deposit payment that just succeeded
  IF NEW.payment_type = 'deposit' AND NEW.status = 'succeeded' 
     AND (OLD.status IS NULL OR OLD.status != 'succeeded') THEN
    
    -- Get the booking details
    SELECT * INTO v_booking
    FROM public.custom_booking_requests
    WHERE id = NEW.booking_id;
    
    IF v_booking IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Check if client account already exists
    IF EXISTS (
      SELECT 1 FROM public.client_accounts WHERE booking_id = NEW.booking_id
    ) THEN
      RETURN NEW;
    END IF;
    
    -- Check if already queued
    IF EXISTS (
      SELECT 1 FROM public.pending_client_accounts 
      WHERE booking_id = NEW.booking_id AND status = 'pending_auth_creation'
    ) THEN
      RETURN NEW;
    END IF;
    
    -- Queue for client creation
    INSERT INTO public.pending_client_accounts (
      booking_id,
      payment_id,
      client_email,
      client_name,
      client_phone,
      client_company,
      status
    ) VALUES (
      NEW.booking_id,
      NEW.id,
      v_booking.client_email,
      v_booking.client_name,
      v_booking.client_phone,
      v_booking.client_company,
      'pending_auth_creation'
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop and create trigger
DROP TRIGGER IF EXISTS trigger_queue_client_creation ON public.payments;
CREATE TRIGGER trigger_queue_client_creation
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.queue_client_creation_on_payment();

-- ============================================
-- STEP 3: Function to create client account
-- ============================================
CREATE OR REPLACE FUNCTION public.create_client_account_from_booking(
  p_booking_id UUID,
  p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
  v_client_account_id UUID;
  v_project_id UUID;
BEGIN
  -- Get booking details
  SELECT * INTO v_booking
  FROM public.custom_booking_requests
  WHERE id = p_booking_id;
  
  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  
  -- Create client account
  INSERT INTO public.client_accounts (
    user_id,
    booking_id,
    company_name,
    status,
    storage_limit_gb,
    storage_used_gb
  ) VALUES (
    p_user_id,
    p_booking_id,
    v_booking.client_company,
    'active',
    5,
    0
  )
  RETURNING id INTO v_client_account_id;
  
  -- Create project
  INSERT INTO public.projects (
    title,
    project_name,
    project_type,
    status,
    client_id,
    client_name,
    client_email,
    booking_id,
    shoot_date,
    notes
  ) VALUES (
    COALESCE(v_booking.project_details, v_booking.client_name || ' - Video Project'),
    COALESCE(v_booking.project_details, v_booking.client_name || ' Project'),
    CASE 
      WHEN v_booking.client_type = 'commercial' THEN 'commercial'
      ELSE 'founder_story'
    END,
    'pre_production',
    p_user_id,
    v_booking.client_name,
    v_booking.client_email,
    p_booking_id,
    v_booking.booking_date::DATE,
    COALESCE(v_booking.admin_notes, 'Auto-created from booking')
  )
  RETURNING id INTO v_project_id;
  
  -- Link project to client account
  UPDATE public.client_accounts
  SET project_id = v_project_id
  WHERE id = v_client_account_id;
  
  -- Mark pending client as processed
  UPDATE public.pending_client_accounts
  SET 
    status = 'completed',
    processed_at = NOW()
  WHERE booking_id = p_booking_id;
  
  RETURN v_client_account_id;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.pending_client_accounts IS 
'Queue for client accounts that need auth user creation';

COMMENT ON FUNCTION public.queue_client_creation_on_payment IS 
'Queues client account creation when deposit payment succeeds';

COMMENT ON FUNCTION public.create_client_account_from_booking IS 
'Creates client account and project from booking data. Called after auth user is created.';

-- ============================================
-- USAGE:
-- ============================================
-- Automatic Flow:
-- 1. Payment succeeds → queued in pending_client_accounts
-- 2. Edge Function polls pending_client_accounts
-- 3. Edge Function creates auth user
-- 4. Edge Function calls create_client_account_from_booking()
-- 5. Client account and project created
-- 6. Welcome email sent
-- ============================================
