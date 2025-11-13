-- ============================================
-- FIX PAYMENT STATUS FOR $2 TEST PAYMENT
-- ============================================
-- This script manually updates the payment status
-- for your test payment that was completed but shows as pending

-- Step 1: Check current payment status
SELECT 
  id,
  booking_id,
  amount,
  status,
  payment_type,
  created_at,
  paid_at
FROM public.payments
WHERE amount = 2
ORDER BY created_at DESC;

-- Step 2: Update payment status to 'succeeded'
UPDATE public.payments
SET 
  status = 'succeeded',
  paid_at = NOW()
WHERE amount = 2
  AND status != 'succeeded'
  AND created_at > NOW() - INTERVAL '1 day';  -- Only recent payments

-- Step 3: Update booking deposit_paid status
UPDATE public.custom_booking_requests
SET 
  deposit_paid = true,
  deposit_paid_at = NOW()
WHERE id IN (
  SELECT booking_id 
  FROM public.payments 
  WHERE amount = 2 
    AND status = 'succeeded'
)
AND deposit_paid IS NOT TRUE;

-- Step 4: Verify the fix
SELECT 
  b.id AS booking_id,
  b.client_name,
  b.client_email,
  b.status AS booking_status,
  b.deposit_paid,
  p.id AS payment_id,
  p.amount,
  p.status AS payment_status,
  p.paid_at
FROM public.custom_booking_requests b
LEFT JOIN public.payments p ON p.booking_id = b.id
WHERE p.amount = 2
ORDER BY b.created_at DESC;

-- ============================================
-- NOTES:
-- - Run each SELECT first to verify before UPDATE
-- - This will update ALL $2 payments from the last day
-- - Adjust the amount filter if you have multiple test payments
-- ============================================
