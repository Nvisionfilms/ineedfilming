# Edge Functions That Need Fixing

## ❌ Current Problem
The app calls 11 Supabase Edge Functions that don't exist, causing all these features to fail:

## 🔧 Functions That Need Replacement

### 1. **submit-custom-booking** (FIXED ✅)
- **Used in**: `LeadCaptureSection.tsx`, `BookingPortal.tsx`
- **Status**: LeadCaptureSection FIXED, BookingPortal still needs fix
- **Fix**: Direct insert to `custom_booking_requests` table

### 2. **create-checkout-session**
- **Used in**: `BookingPortal.tsx` (line 263)
- **Purpose**: Create Stripe payment session
- **Fix**: Need Stripe integration or disable payment

### 3. **create-meeting**
- **Used in**: `AdminProjects.tsx`, `AdminPipeline.tsx`, `AdminBookings.tsx`
- **Purpose**: Create meeting and send calendar invites
- **Fix**: Direct insert to `meetings` table (if exists) or disable feature

### 4. **send-client-notification**
- **Used in**: `AdminClients.tsx` (line 206)
- **Purpose**: Send email notifications to clients
- **Fix**: Remove or use email service (SendGrid/Resend)

### 5. **create-client-account**
- **Used in**: `AdminClients.tsx` (line 239)
- **Purpose**: Create client portal account
- **Fix**: Direct insert to `client_accounts` table + create auth user

### 6. **resend-confirmation-email**
- **Used in**: `AdminClients.tsx` (line 417)
- **Purpose**: Resend email confirmation
- **Fix**: Use Supabase auth resend or disable

### 7. **approve-custom-booking**
- **Used in**: `AdminBookings.tsx` (line 174)
- **Purpose**: Approve/reject/counter booking requests
- **Fix**: Direct update to `custom_booking_requests` table

### 8. **submit-newsletter**
- **Used in**: `NewsletterPopup.tsx` (line 57)
- **Purpose**: Newsletter signup
- **Fix**: Direct insert to `newsletter_subscribers` table (create if needed)

### 9. **create-payment-link**
- **Used in**: `PaymentLinkDialog.tsx` (line 36)
- **Purpose**: Generate Stripe payment link
- **Fix**: Need Stripe integration or disable

### 10. **purchase-storage-upgrade**
- **Used in**: `StorageUpgradeDialog.tsx` (line 47)
- **Purpose**: Purchase additional storage
- **Fix**: Disable or integrate payment

---

## 🎯 Priority Fixes (Critical for Basic Functionality)

### HIGH PRIORITY:
1. ✅ **submit-custom-booking** (LeadCaptureSection) - FIXED
2. ❌ **submit-custom-booking** (BookingPortal) - NEEDS FIX
3. ❌ **approve-custom-booking** (AdminBookings) - NEEDS FIX
4. ❌ **create-client-account** (AdminClients) - NEEDS FIX

### MEDIUM PRIORITY:
5. **create-meeting** - Can work around manually
6. **submit-newsletter** - Can disable popup

### LOW PRIORITY (Can Disable):
7. **create-checkout-session** - Payment integration
8. **create-payment-link** - Payment integration
9. **purchase-storage-upgrade** - Premium feature
10. **send-client-notification** - Email notifications
11. **resend-confirmation-email** - Email feature

---

## 📋 Recommended Action Plan

### Phase 1: Fix Critical Booking Flow (NOW)
1. Fix `BookingPortal.tsx` - submit-custom-booking
2. Fix `AdminBookings.tsx` - approve-custom-booking
3. Fix `AdminClients.tsx` - create-client-account

### Phase 2: Disable Non-Essential Features
1. Remove/hide payment buttons
2. Disable newsletter popup
3. Hide storage upgrade option
4. Remove meeting scheduler (or make manual)

### Phase 3: Add Email Service (Later)
1. Integrate SendGrid/Resend for notifications
2. Re-enable email features

---

## 🚀 Quick Wins

**Disable features that require Edge Functions:**
- Comment out newsletter popup
- Hide payment buttons
- Remove storage upgrade dialog
- Make meetings manual (no auto-calendar)

This will make the app functional without Edge Functions!
