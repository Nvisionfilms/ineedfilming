# Payment Workflow Guide
## Deposit → Final Payment System

---

## 📋 **Overview**

Your system now supports a complete deposit-to-final-payment workflow with automatic tracking and reminders.

---

## 🔄 **Complete Payment Flow**

### **Step 1: Client Books & Pays Deposit**
1. Client receives approval email with token
2. Client visits `BookingPortal.tsx?token=...`
3. Client selects "Pay Deposit" (30% or 50%)
4. Stripe checkout session created
5. Payment recorded in `payments` table with:
   - `payment_type = 'deposit'`
   - `status = 'pending'`
   - `booking_id` linked

### **Step 2: Deposit Payment Succeeds (Webhook)**
When Stripe webhook confirms payment:
1. Payment status updated to `'succeeded'` or `'paid'`
2. **Trigger automatically fires** (`trigger_create_final_payment`)
3. System calculates outstanding balance
4. System creates **final payment record**:
   - `payment_type = 'final'`
   - `status = 'pending'`
   - `amount = total_price - deposit_paid`
   - `due_date = shoot_date - 1 day` (or 30 days if no shoot date)
   - `parent_payment_id = deposit_payment_id`
5. Updates:
   - `booking.deposit_paid = true`
   - `project.payment_status = 'deposit_paid'`

### **Step 3: Admin Sets Shoot Date**
1. Admin goes to `AdminProjects.tsx`
2. Sets `shoot_date` for the project
3. System automatically updates `final_payment_due_date`
4. Final payment `due_date` recalculated to `shoot_date - 1 day`

### **Step 4: Admin Sends Final Payment Link**
**Option A: Manual Link Generation**
1. Admin opens `AdminBookings.tsx`
2. Clicks "Generate Payment Link" via `PaymentLinkDialog`
3. System generates Stripe checkout for final payment
4. Email sent to client with payment link

**Option B: Automated Reminder (Future Enhancement)**
- System sends reminder 7 days before `due_date`
- System sends reminder 3 days before `due_date`
- System sends reminder on `due_date`

### **Step 5: Client Pays Final Balance**
1. Client clicks payment link
2. Completes Stripe checkout
3. Webhook updates payment status to `'succeeded'`
4. System updates:
   - `booking.full_payment_received = true`
   - `project.payment_status = 'fully_paid'`
5. **Editing can now begin!**

---

## 🗄️ **Database Schema Changes**

### **`payments` Table - New Columns**
```sql
due_date                TIMESTAMPTZ    -- When payment is due
stripe_checkout_url     TEXT           -- Direct link to Stripe checkout
parent_payment_id       UUID           -- Links final payment to deposit
is_balance_payment      BOOLEAN        -- Auto-generated balance payment
```

### **`projects` Table - New Columns**
```sql
shoot_date              DATE           -- Scheduled filming date
final_payment_due_date  DATE           -- When final payment is due
payment_status          TEXT           -- pending | deposit_paid | fully_paid | overdue
```

### **`custom_booking_requests` Table - New Columns**
```sql
deposit_paid            BOOLEAN        -- Deposit received
deposit_paid_at         TIMESTAMPTZ    -- When deposit was paid
full_payment_received   BOOLEAN        -- Full payment received
full_payment_received_at TIMESTAMPTZ   -- When full payment was received
```

---

## 📊 **Payment Summary View**

Query the `payment_summary` view to see all payment statuses:

```sql
SELECT * FROM public.payment_summary
WHERE booking_status IN ('approved', 'countered')
ORDER BY final_payment_due ASC NULLS LAST;
```

**Returns:**
- `booking_id`, `client_name`, `client_email`
- `total_price`, `total_paid`, `outstanding_balance`
- `deposit_paid`, `full_payment_received`
- `shoot_date`, `final_payment_due_date`
- `project_payment_status`
- `deposit_paid_date`, `final_paid_date`, `final_payment_due`

---

## 🎯 **Admin Dashboard Features**

### **AdminBookings.tsx**
Shows payment status for each booking:
- ✅ **Paid** - Full payment received
- ⏳ **Pending** - Awaiting payment
- ⚠️ **Overdue** - Past due date

### **AdminPayments.tsx**
- View all payment transactions
- Filter by status (paid, pending, overdue)
- See outstanding balances
- Track payment history per client
- Generate payment links

### **AdminProjects.tsx**
- Set shoot dates
- View payment status
- Track when final payment is due
- See if editing can begin

---

## 🔔 **Payment Reminders (Future Enhancement)**

### **Recommended Implementation:**

1. **Create Scheduled Job** (Supabase Edge Function + Cron)
   ```typescript
   // supabase/functions/payment-reminders/index.ts
   
   // Run daily at 9 AM
   // Check for payments due in 7 days, 3 days, or today
   // Send email reminders via Resend
   ```

2. **Email Templates:**
   - **7 Days Before**: "Your shoot is coming up! Final payment due soon."
   - **3 Days Before**: "Reminder: Final payment due in 3 days."
   - **Due Date**: "Final payment due today - editing begins after payment."
   - **Overdue**: "Payment overdue - please complete to begin editing."

3. **Admin Notifications:**
   - Dashboard widget showing overdue payments
   - Email digest of upcoming due dates

---

## 💡 **Key Functions**

### **`get_outstanding_balance(booking_id)`**
Calculates remaining balance for a booking:
```sql
SELECT public.get_outstanding_balance('booking-uuid-here');
-- Returns: 3500.00 (if $5000 total, $1500 deposit paid)
```

### **`create_final_payment_on_deposit()` Trigger**
Automatically runs when deposit payment succeeds:
- Creates final payment record
- Sets due date
- Updates statuses

---

## 🚀 **Setup Instructions**

### **1. Run the Enhancement Script**
```bash
# In Supabase SQL Editor, run:
ENHANCE_PAYMENT_TRACKING.sql
```

### **2. Update Existing Bookings (Optional)**
If you have existing bookings with deposits paid:
```sql
-- Manually trigger final payment creation for existing deposits
UPDATE public.payments 
SET status = status  -- Triggers the update trigger
WHERE payment_type = 'deposit' 
AND status IN ('succeeded', 'paid')
AND booking_id IN (
  SELECT id FROM custom_booking_requests 
  WHERE status IN ('approved', 'countered')
);
```

### **3. Test the Workflow**
1. Create a test booking
2. Approve it
3. Pay deposit via Stripe test mode
4. Verify final payment record is created
5. Set shoot date on project
6. Verify due date updates
7. Pay final balance
8. Verify project status = 'fully_paid'

---

## 📝 **Business Rules**

### **Deposit Requirements**
- **Under $5,000**: 50% deposit required
- **$5,000+**: 30% deposit required

### **Payment Terms**
- Deposit reserves the film date
- Final payment due **1 day before shoot date**
- If no shoot date set: due **30 days after deposit**
- **Editing begins only after full payment received**

### **Payment Types**
- `deposit` - Initial payment to reserve date
- `full` - Full payment upfront (no balance)
- `final` - Final balance payment
- `milestone` - Custom milestone payments
- `storage_upgrade` - Additional storage purchases

---

## 🔍 **Monitoring & Reports**

### **Outstanding Balances Report**
```sql
SELECT 
  client_name,
  client_email,
  total_price,
  total_paid,
  outstanding_balance,
  final_payment_due,
  CASE 
    WHEN final_payment_due < NOW() THEN 'OVERDUE'
    WHEN final_payment_due < NOW() + INTERVAL '3 days' THEN 'DUE SOON'
    ELSE 'OK'
  END AS urgency
FROM public.payment_summary
WHERE outstanding_balance > 0
ORDER BY final_payment_due ASC NULLS LAST;
```

### **Revenue Tracking**
```sql
SELECT 
  DATE_TRUNC('month', paid_at) AS month,
  payment_type,
  COUNT(*) AS payment_count,
  SUM(amount) AS total_revenue
FROM public.payments
WHERE status IN ('succeeded', 'paid')
GROUP BY month, payment_type
ORDER BY month DESC;
```

---

## ✅ **Checklist: Is Payment System Ready?**

- [ ] Run `ENHANCE_PAYMENT_TRACKING.sql`
- [ ] Verify `payments` table has `due_date` column
- [ ] Verify `projects` table has `shoot_date` column
- [ ] Test deposit payment → final payment creation
- [ ] Set shoot dates on active projects
- [ ] Test final payment completion
- [ ] Verify `payment_summary` view works
- [ ] Update admin UI to show payment statuses
- [ ] (Optional) Implement payment reminder emails

---

## 🎉 **You're All Set!**

Your payment system now:
- ✅ Tracks deposits and final payments separately
- ✅ Automatically creates final payment records
- ✅ Calculates due dates based on shoot dates
- ✅ Updates project statuses automatically
- ✅ Provides clear visibility into outstanding balances
- ✅ Enforces "no editing until paid" business rule

**Next Steps:**
1. Run the SQL enhancement script
2. Test with a real booking
3. Consider adding automated email reminders
4. Monitor the `payment_summary` view for overdue payments
