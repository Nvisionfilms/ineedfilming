# Payment Status Sync Issues - Complete Fix Guide

## 🐛 **Problems Identified**

### **Issue #1: Payment Status Not Updating**
**Problem:** When client pays via Stripe, payment record stays as "pending" instead of updating to "succeeded"

**Root Cause:**
- `create-payment-link` function creates payment with `status: 'pending'`
- Stripe webhook doesn't update the existing payment record
- Webhook only handles direct checkouts, not payment links

### **Issue #2: Payment Balance Shows Wrong Status**
**Problem:** Payment Balance page shows "Pending" even though payment was completed

**Root Cause:**
- Payment status in database is still "pending"
- Dashboard and Payment Balance pages filter by `status = 'succeeded'` or `'paid'`

### **Issue #3: Dashboard Revenue Incorrect**
**Problem:** Dashboard showed revenue from approved bookings, not actual payments

**Root Cause:**
- Dashboard calculated revenue from `approved_price` of approved bookings
- Should calculate from actual paid payments only

---

## ✅ **Fixes Implemented**

### **Fix #1: Dashboard Revenue Calculation**
**File:** `pages/AdminDashboard.tsx`

**Changed:**
```typescript
// BEFORE - Wrong (from approved bookings)
const totalRevenue = bookings
  .filter((b) => b.status === "approved")
  .reduce((sum, b) => sum + parseFloat(String(b.approved_price || b.requested_price)), 0);

// AFTER - Correct (from actual payments)
const totalRevenue = payments
  ?.filter((p) => p.status === "succeeded" || p.status === "paid")
  .reduce((sum, p) => sum + parseFloat(String(p.amount)), 0) || 0;
```

**Also fixed monthly revenue chart** to use actual payment dates instead of booking approval dates.

---

### **Fix #2: Stripe Webhook Handler**
**File:** `supabase/functions/stripe-webhook-handler/index-fixed.ts`

**What it does now:**
1. **Detects payment link completions** (has `booking_id` in metadata)
2. **Finds existing pending payment** record
3. **Updates status to 'succeeded'** with payment details
4. **Sets `paid_at` timestamp**
5. **Updates booking `deposit_paid` flag**

**Key improvements:**
- Handles both payment links AND direct checkouts
- Updates existing payment records instead of creating duplicates
- Properly links payments to bookings
- Sets correct timestamps

---

### **Fix #3: Quick SQL Fix for Current $2 Payment**
**File:** `FIX_PAYMENT_STATUS.sql`

Run this in Supabase SQL Editor to fix your current test payment:

```sql
-- Update payment status
UPDATE public.payments
SET 
  status = 'succeeded',
  paid_at = NOW()
WHERE amount = 2
  AND status != 'succeeded'
  AND created_at > NOW() - INTERVAL '1 day';

-- Update booking
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
```

---

## 🚀 **Deployment Steps**

### **Step 1: Fix Current $2 Payment (Immediate)**
1. Open Supabase SQL Editor
2. Run the contents of `FIX_PAYMENT_STATUS.sql`
3. Verify payment shows as "succeeded"
4. Check Payment Balance page - should now show "Paid"

### **Step 2: Deploy Dashboard Fix**
```bash
git add pages/AdminDashboard.tsx
git commit -m "Fix: Calculate revenue from actual payments, not approved bookings"
git push
```

### **Step 3: Deploy Webhook Fix**
```bash
# Replace the old webhook handler
cp supabase/functions/stripe-webhook-handler/index-fixed.ts supabase/functions/stripe-webhook-handler/index.ts

# Deploy to Supabase
supabase functions deploy stripe-webhook-handler
```

### **Step 4: Test the Full Flow**
1. Create new test booking
2. Generate payment link
3. Complete payment via Stripe
4. Verify:
   - Payment status updates to "succeeded"
   - Payment Balance shows "Paid"
   - Dashboard revenue updates
   - Deposit triggers final payment creation

---

## 🔍 **How to Verify It's Working**

### **Check Payment Status:**
```sql
SELECT 
  p.id,
  p.booking_id,
  p.amount,
  p.status,
  p.payment_type,
  p.paid_at,
  b.client_name,
  b.deposit_paid
FROM public.payments p
LEFT JOIN public.custom_booking_requests b ON b.id = p.booking_id
ORDER BY p.created_at DESC
LIMIT 10;
```

### **Check Payment Balance View:**
```sql
SELECT * FROM public.payment_summary
WHERE outstanding_balance > 0
ORDER BY created_at DESC;
```

### **Check Dashboard Revenue:**
- Should only count payments with `status = 'succeeded'`
- Should match total from payments table
- Should NOT include unpaid approved bookings

---

## 📊 **Expected Behavior After Fix**

### **Payment Link Flow:**
```
1. Admin generates payment link
   ↓
2. Payment record created (status: 'pending')
   ↓
3. Client pays via Stripe
   ↓
4. Webhook receives checkout.session.completed
   ↓
5. Webhook updates payment (status: 'succeeded', paid_at: NOW())
   ↓
6. Webhook updates booking (deposit_paid: true)
   ↓
7. Trigger creates final payment record
   ↓
8. Payment Balance shows "Paid"
   ↓
9. Dashboard revenue updates
```

### **Direct Checkout Flow:**
```
1. Client pays on website
   ↓
2. Webhook creates booking (status: 'approved', deposit_paid: true)
   ↓
3. Webhook creates payment (status: 'succeeded')
   ↓
4. Trigger creates final payment record
   ↓
5. Everything synced automatically
```

---

## 🐛 **Common Issues & Solutions**

### **Issue: Webhook not firing**
**Solution:**
1. Check Stripe Dashboard → Webhooks
2. Verify webhook endpoint is correct
3. Check webhook secret in Supabase env vars
4. Look at webhook logs in Stripe for errors

### **Issue: Payment still shows pending**
**Solution:**
1. Check if webhook is configured
2. Manually run `FIX_PAYMENT_STATUS.sql`
3. Verify Stripe payment actually succeeded
4. Check Supabase function logs

### **Issue: Dashboard revenue still wrong**
**Solution:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Check if code deployed successfully
3. Verify payments table has correct statuses

---

## 📝 **Status Values**

### **Payment Status:**
- `pending` - Payment link created, not yet paid
- `succeeded` - Payment completed successfully ✅
- `paid` - Alternative success status ✅
- `failed` - Payment failed
- `canceled` - Payment canceled

### **Booking Status:**
- `pending` - Awaiting admin review
- `approved` - Admin approved
- `countered` - Counter-offer sent
- `rejected` - Rejected

### **Booking Payment Flags:**
- `deposit_paid` - Deposit payment received
- `full_payment_received` - All payments complete

---

## ✅ **Summary**

**Fixed:**
1. ✅ Dashboard revenue now calculates from actual payments
2. ✅ Stripe webhook updates payment status correctly
3. ✅ Payment Balance shows accurate status
4. ✅ SQL script to fix current $2 payment

**To Deploy:**
1. Run `FIX_PAYMENT_STATUS.sql` in Supabase (immediate fix)
2. Deploy dashboard changes to GitHub
3. Deploy updated webhook handler to Supabase
4. Test with new payment

**After deployment, all payments will sync correctly!** 🎉
