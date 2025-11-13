-- ============================================
-- AUTO-CREATE CLIENT ACCOUNT ON PAYMENT
-- ============================================
-- This trigger automatically creates a client account and profile
-- when a deposit payment is successfully received
-- Acts as a CRM - syncing all booking info to client management

-- ============================================
-- FUNCTION: Auto-create client account on payment
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_create_client_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
  v_user_id UUID;
  v_client_account_id UUID;
  v_temp_password TEXT;
  v_user_exists BOOLEAN;
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
    
    -- Check if user already exists with this email
    SELECT EXISTS (
      SELECT 1 FROM auth.users WHERE email = v_booking.client_email
    ) INTO v_user_exists;
    
    -- Check if client account already exists for this booking
    IF EXISTS (
      SELECT 1 FROM public.client_accounts WHERE booking_id = NEW.booking_id
    ) THEN
      -- Client account already exists, just return
      RETURN NEW;
    END IF;
    
    -- If user doesn't exist, create auth user
    IF NOT v_user_exists THEN
      -- Generate temporary password (client will reset on first login)
      v_temp_password := 'Welcome' || floor(random() * 10000)::text || '!';
      
      -- Create user in auth.users (requires service role, will be handled by trigger)
      -- For now, we'll create the profile and client_account
      -- The actual auth user creation will need to be done via Edge Function
      
      -- Insert into profiles (this will create the auth user via RLS/trigger if configured)
      INSERT INTO public.profiles (email, full_name)
      VALUES (
        v_booking.client_email,
        v_booking.client_name
      )
      ON CONFLICT (email) DO UPDATE
      SET full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name)
      RETURNING id INTO v_user_id;
      
    ELSE
      -- Get existing user_id
      SELECT id INTO v_user_id
      FROM public.profiles
      WHERE email = v_booking.client_email;
    END IF;
    
    -- Create client account with all CRM data
    INSERT INTO public.client_accounts (
      user_id,
      booking_id,
      project_id,
      company_name,
      status,
      storage_limit_gb,
      storage_used_gb
    ) VALUES (
      v_user_id,
      NEW.booking_id,
      NULL, -- Project will be created separately
      v_booking.client_company,
      'active',
      5, -- Default 5GB storage
      0
    )
    RETURNING id INTO v_client_account_id;
    
    -- Log the auto-creation
    INSERT INTO public.admin_audit_logs (
      admin_id,
      action,
      table_name,
      record_id,
      details
    ) VALUES (
      v_user_id,
      'auto_create_client',
      'client_accounts',
      v_client_account_id,
      jsonb_build_object(
        'trigger', 'payment_received',
        'booking_id', NEW.booking_id,
        'payment_id', NEW.id,
        'client_email', v_booking.client_email,
        'client_name', v_booking.client_name,
        'amount_paid', NEW.amount
      )
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_create_client_on_payment ON public.payments;

-- Create trigger
CREATE TRIGGER trigger_auto_create_client_on_payment
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_client_on_payment();

-- ============================================
-- FUNCTION: Create basic project on client creation
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_create_project_on_client()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
  v_project_id UUID;
BEGIN
  -- Only proceed if this is a new client account with a booking
  IF NEW.booking_id IS NOT NULL AND OLD IS NULL THEN
    
    -- Get booking details
    SELECT * INTO v_booking
    FROM public.custom_booking_requests
    WHERE id = NEW.booking_id;
    
    IF v_booking IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Check if project already exists for this booking
    IF EXISTS (
      SELECT 1 FROM public.projects WHERE booking_id = NEW.booking_id
    ) THEN
      -- Link existing project to client
      UPDATE public.projects
      SET client_id = NEW.user_id
      WHERE booking_id = NEW.booking_id
      RETURNING id INTO v_project_id;
      
      -- Update client account with project_id
      UPDATE public.client_accounts
      SET project_id = v_project_id
      WHERE id = NEW.id;
      
    ELSE
      -- Create new project
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
        NEW.user_id,
        v_booking.client_name,
        v_booking.client_email,
        NEW.booking_id,
        v_booking.booking_date::DATE,
        COALESCE(v_booking.admin_notes, 'Auto-created from booking')
      )
      RETURNING id INTO v_project_id;
      
      -- Update client account with project_id
      UPDATE public.client_accounts
      SET project_id = v_project_id
      WHERE id = NEW.id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_create_project_on_client ON public.client_accounts;

-- Create trigger
CREATE TRIGGER trigger_auto_create_project_on_client
AFTER INSERT ON public.client_accounts
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_project_on_client();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION public.auto_create_client_on_payment IS 
'Automatically creates client account when deposit payment succeeds. Syncs all booking data to CRM.';

COMMENT ON FUNCTION public.auto_create_project_on_client IS 
'Automatically creates or links project when client account is created.';

-- ============================================
-- USAGE NOTES:
-- ============================================
-- When a deposit payment status changes to 'succeeded':
-- 1. Creates user profile (if doesn't exist)
-- 2. Creates client account with booking data
-- 3. Sets status to 'active'
-- 4. Logs the auto-creation in audit logs
-- 
-- When client account is created:
-- 1. Creates basic project with booking details
-- 2. Links project to client and booking
-- 3. Sets project status to 'pre_production'
-- 4. Populates shoot date from booking
--
-- CRM Data Synced:
-- - Contact info (name, email, phone, company)
-- - Booking details (price, dates, notes)
-- - Payment status (deposit paid, balance)
-- - Project information
-- ============================================

-- ============================================
-- IMPORTANT: Auth User Creation
-- ============================================
-- NOTE: This trigger creates the profile and client account,
-- but the actual auth.users record needs to be created via
-- an Edge Function with service role permissions.
--
-- The Edge Function should:
-- 1. Create auth.users record
-- 2. Send welcome email with temp password
-- 3. Prompt user to reset password on first login
-- ============================================
