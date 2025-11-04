# 🔑 EDGE FUNCTIONS API DEPENDENCIES AUDIT

## Overview
This document lists all Edge Functions and their external API dependencies.

---

## ✅ REQUIRED API KEYS (Already Set)

### 1. **STRIPE_SECRET_KEY** ✅ SET
**Used by:**
- `create-checkout-session` - Creates Stripe checkout sessions
- `stripe-webhook-handler` - Processes Stripe webhooks
- `create-payment-link` - Creates payment links for clients
- `purchase-storage-upgrade` - Handles storage upgrades

**Status:** ✅ LIVE key set (`sk_live_...`)

---

### 2. **STRIPE_WEBHOOK_SECRET** ✅ SET
**Used by:**
- `stripe-webhook-handler` - Verifies webhook signatures

**Status:** ✅ LIVE secret set (`whsec_...`)

---

### 3. **RESEND_API_KEY** ✅ SET
**Used by:**
- `submit-custom-booking` - Sends booking confirmation emails
- `submit-newsletter` - Sends newsletter welcome emails
- `create-payment-link` - Sends payment link emails
- `create-meeting` - Sends meeting invitation emails
- `create-client-account` - Sends account creation emails
- `approve-custom-booking` - Sends approval/rejection emails
- `send-review-request` - Sends review request emails

**Status:** ✅ Set (`re_Hy74KX9i_3aimKggRY1EnRg1qVyZ75rjL`)

---

## ⚠️ OPTIONAL API KEYS (Not Set)

### 4. **OPENAI_API_KEY** ⚠️ NOT SET
**Used by:**
- `vision-chat` - AI chat functionality

**Status:** ⚠️ NOT SET
**Impact:** AI chat feature won't work
**Action Needed:** Only if you want to enable AI chat
**Get it from:** https://platform.openai.com/api-keys

---

## 📋 BUILT-IN SUPABASE KEYS (Auto-Set)

These are automatically available in all Edge Functions:

### **SUPABASE_URL** ✅ AUTO
- Used by all Edge Functions for database access

### **SUPABASE_SERVICE_ROLE_KEY** ✅ AUTO
- Used by Edge Functions that need admin access to bypass RLS

### **SUPABASE_ANON_KEY** ✅ AUTO
- Used by Edge Functions that need public access

---

## 🔍 EDGE FUNCTION BREAKDOWN

### **1. approve-custom-booking**
**APIs:** Resend
**Purpose:** Approve/reject custom bookings, send emails
**Status:** ✅ Ready (Resend key set)
**Deployed:** ❌ Not deployed yet

---

### **2. create-checkout-session**
**APIs:** Stripe
**Purpose:** Create Stripe checkout sessions for payments
**Status:** ✅ Ready (Stripe LIVE keys set)
**Deployed:** ✅ YES

---

### **3. create-client-account**
**APIs:** Resend
**Purpose:** Create client portal accounts, send welcome emails
**Status:** ✅ Ready (Resend key set)
**Deployed:** ❌ Not deployed yet (replaced with direct DB)

---

### **4. create-meeting**
**APIs:** Resend
**Purpose:** Create meetings, send calendar invites
**Status:** ✅ Ready (Resend key set)
**Deployed:** ❌ Not deployed yet (replaced with direct DB)

---

### **5. create-payment-link**
**APIs:** Stripe, Resend
**Purpose:** Create payment links for bookings
**Status:** ✅ Ready (both keys set)
**Deployed:** ❌ Not deployed yet

---

### **6. purchase-storage-upgrade**
**APIs:** Stripe
**Purpose:** Handle storage upgrade purchases
**Status:** ✅ Ready (Stripe LIVE keys set)
**Deployed:** ❌ Not deployed yet

---

### **7. resend-confirmation-email**
**APIs:** Supabase Auth (built-in)
**Purpose:** Resend email confirmations
**Status:** ✅ Ready (no external API needed)
**Deployed:** ❌ Not deployed yet

---

### **8. send-review-request**
**APIs:** Resend
**Purpose:** Send review requests to clients
**Status:** ✅ Ready (Resend key set)
**Deployed:** ❌ Not deployed yet

---

### **9. stripe-webhook-handler**
**APIs:** Stripe
**Purpose:** Process Stripe payment webhooks
**Status:** ✅ Ready (Stripe LIVE keys set)
**Deployed:** ✅ YES

---

### **10. submit-custom-booking**
**APIs:** Resend
**Purpose:** Submit custom bookings, send notifications
**Status:** ✅ Ready (Resend key set)
**Deployed:** ✅ YES

---

### **11. submit-newsletter**
**APIs:** Resend
**Purpose:** Newsletter signups, send welcome emails
**Status:** ✅ Ready (Resend key set)
**Deployed:** ❌ Not deployed yet

---

### **12. vision-chat**
**APIs:** OpenAI
**Purpose:** AI chat functionality
**Status:** ⚠️ NOT READY (OpenAI key not set)
**Deployed:** ❌ Not deployed yet

---

## 📊 SUMMARY

### **API Keys Status:**
| API Key | Status | Used By | Critical? |
|---------|--------|---------|-----------|
| STRIPE_SECRET_KEY | ✅ SET (LIVE) | 4 functions | ✅ YES |
| STRIPE_WEBHOOK_SECRET | ✅ SET (LIVE) | 1 function | ✅ YES |
| RESEND_API_KEY | ✅ SET | 7 functions | ✅ YES |
| OPENAI_API_KEY | ❌ NOT SET | 1 function | ❌ NO |

### **Deployment Status:**
| Function | Deployed | Used in App | Priority |
|----------|----------|-------------|----------|
| create-checkout-session | ✅ YES | ✅ YES | 🔴 CRITICAL |
| stripe-webhook-handler | ✅ YES | ✅ YES | 🔴 CRITICAL |
| submit-custom-booking | ✅ YES | ✅ YES | 🔴 CRITICAL |
| create-payment-link | ❌ NO | ⚠️ MAYBE | 🟡 MEDIUM |
| purchase-storage-upgrade | ❌ NO | ⚠️ MAYBE | 🟡 MEDIUM |
| submit-newsletter | ❌ NO | ❌ NO | 🟢 LOW |
| approve-custom-booking | ❌ NO | ❌ NO | 🟢 LOW |
| create-client-account | ❌ NO | ❌ NO | 🟢 LOW |
| create-meeting | ❌ NO | ❌ NO | 🟢 LOW |
| send-review-request | ❌ NO | ❌ NO | 🟢 LOW |
| resend-confirmation-email | ❌ NO | ❌ NO | 🟢 LOW |
| vision-chat | ❌ NO | ❌ NO | 🟢 LOW |

---

## ✅ ACTION ITEMS

### **COMPLETED:**
- ✅ Set STRIPE_SECRET_KEY (LIVE)
- ✅ Set STRIPE_WEBHOOK_SECRET (LIVE)
- ✅ Set RESEND_API_KEY
- ✅ Deploy create-checkout-session
- ✅ Deploy stripe-webhook-handler
- ✅ Deploy submit-custom-booking
- ✅ Fix RLS policies for anonymous submissions

### **OPTIONAL (If Needed):**
- [ ] Deploy `create-payment-link` (if you want admin to send payment links)
- [ ] Deploy `purchase-storage-upgrade` (if you want storage upgrade feature)
- [ ] Deploy `submit-newsletter` (if you want newsletter email confirmations)
- [ ] Set OPENAI_API_KEY (if you want AI chat feature)
- [ ] Deploy `vision-chat` (if you want AI chat feature)

### **NOT NEEDED (Replaced with Direct DB):**
- ❌ `approve-custom-booking` - Replaced with direct DB update in AdminBookings
- ❌ `create-client-account` - Replaced with Supabase Auth in AdminClients
- ❌ `create-meeting` - Replaced with direct DB insert in AdminBookings

---

## 🎯 RECOMMENDATIONS

### **Deploy Now (If You Need These Features):**

1. **create-payment-link** - If you want to send payment links to clients from admin panel
   ```powershell
   npx supabase functions deploy create-payment-link
   ```

2. **purchase-storage-upgrade** - If you want clients to buy storage upgrades
   ```powershell
   npx supabase functions deploy purchase-storage-upgrade
   ```

3. **submit-newsletter** - If you want to send welcome emails to newsletter subscribers
   ```powershell
   npx supabase functions deploy submit-newsletter
   ```

### **Deploy Later (Nice to Have):**

4. **send-review-request** - For automated review requests after projects
5. **approve-custom-booking** - If you want email notifications for approvals (currently handled in admin panel)

### **Skip (Not Needed):**

- `create-client-account` - Already replaced with direct Supabase Auth
- `create-meeting` - Already replaced with direct DB insert
- `resend-confirmation-email` - Can use Supabase's built-in resend
- `vision-chat` - Only if you want AI chat (needs OpenAI key)

---

## 🔐 SECURITY NOTES

### **All API Keys Are Secure:**
- ✅ Stored as Supabase secrets (not in code)
- ✅ Only accessible to Edge Functions
- ✅ Never exposed to frontend
- ✅ Using LIVE keys for production

### **Email Security:**
- ✅ Resend configured with your domain
- ✅ Emails sent from `noreply@nvisionfilms.com`
- ✅ Admin emails go to `nvisionmg@gmail.com`

### **Payment Security:**
- ✅ Stripe LIVE mode enabled
- ✅ Webhook signature verification active
- ✅ Real payments processing securely

---

## 🎉 CONCLUSION

**Your critical Edge Functions are ready and deployed!**

- ✅ Payment processing works (Stripe)
- ✅ Email notifications work (Resend)
- ✅ Booking submissions work
- ✅ All API keys properly configured

**Optional features** can be deployed as needed. Everything is set up correctly! 🚀
