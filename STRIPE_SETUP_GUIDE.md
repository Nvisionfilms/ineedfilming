# Stripe Payment Integration Setup Guide

## Overview
Your booking portal now has full Stripe payment integration. Customers can pay deposits or full amounts, and bookings are automatically created upon successful payment.

---

## 🔑 Step 1: Get Your Stripe API Keys

### 1. Create/Login to Stripe Account
- Go to https://dashboard.stripe.com/register
- Create an account or login

### 2. Get API Keys
- Navigate to **Developers → API keys**
- You'll see two types of keys:
  - **Publishable key** (starts with `pk_test_` or `pk_live_`)
  - **Secret key** (starts with `sk_test_` or `sk_live_`)

### 3. Get Webhook Secret
- Go to **Developers → Webhooks**
- Click **Add endpoint**
- Enter your webhook URL: `https://tkkfatwpzjzzoszjiigd.supabase.co/functions/v1/stripe-webhook-handler`
- Select events to listen to:
  - `checkout.session.completed`
- Click **Add endpoint**
- Copy the **Signing secret** (starts with `whsec_`)

---

## 🔧 Step 2: Configure Supabase Edge Functions

### 1. Set Supabase Secrets
Run these commands in your terminal (replace with your actual keys):

```bash
# Navigate to project directory
cd "e:\dg\nvision funnels"

# Set Stripe secret key
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# Set webhook secret
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

### 2. Deploy Edge Functions
```bash
# Deploy checkout session function
npx supabase functions deploy create-checkout-session

# Deploy webhook handler
npx supabase functions deploy stripe-webhook-handler
```

---

## 🌐 Step 3: Configure Frontend Environment Variables

### Local Development (.env file)
Add to your `.env` file:
```env
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_PUBLISHABLE_KEY_HERE"
```

### Netlify Production
1. Go to https://app.netlify.com/sites/nvisionfilms/settings/env
2. Click **Add a variable**
3. Add:
   - **Key**: `VITE_STRIPE_PUBLISHABLE_KEY`
   - **Value**: `pk_test_YOUR_PUBLISHABLE_KEY_HERE` (or `pk_live_` for production)
4. Click **Save**
5. Trigger a new deploy

---

## 🧪 Step 4: Test the Integration

### Test Mode (Recommended First)
1. Use test API keys (starting with `pk_test_` and `sk_test_`)
2. Go to your booking portal: https://ineedfilming.com/booking-portal
3. Select a package and fill out the form
4. Click "Proceed to Payment"
5. Use Stripe test card:
   - **Card number**: `4242 4242 4242 4242`
   - **Expiry**: Any future date
   - **CVC**: Any 3 digits
   - **ZIP**: Any 5 digits

### Verify Success
1. Check Stripe Dashboard → Payments (should see test payment)
2. Check Supabase Dashboard → Table Editor → `custom_booking_requests` (should see new booking with status "approved")
3. Check Supabase Dashboard → Table Editor → `payments` (should see payment record)

---

## 🚀 Step 5: Go Live

### Switch to Live Mode
1. In Stripe Dashboard, toggle from **Test mode** to **Live mode**
2. Get your **live** API keys from **Developers → API keys**
3. Update all environment variables with live keys:
   - `VITE_STRIPE_PUBLISHABLE_KEY` → `pk_live_...`
   - `STRIPE_SECRET_KEY` (Supabase secret) → `sk_live_...`
4. Update webhook endpoint to use live mode
5. Redeploy Edge Functions and frontend

---

## 📊 How It Works

### Payment Flow
1. **Customer fills booking form** → Selects package, date, time
2. **Clicks "Proceed to Payment"** → Frontend calls `create-checkout-session` Edge Function
3. **Edge Function creates Stripe session** → Returns checkout URL
4. **Customer redirected to Stripe** → Enters payment details
5. **Payment processed** → Stripe sends webhook to `stripe-webhook-handler`
6. **Webhook creates booking** → Inserts into `custom_booking_requests` with status "approved"
7. **Webhook creates payment record** → Inserts into `payments` table
8. **Customer redirected back** → Sees success page

### Database Tables Used
- **custom_booking_requests**: Stores booking details
- **payments**: Stores payment transaction records

---

## 🔍 Troubleshooting

### Edge Function Not Found
```bash
# Redeploy functions
npx supabase functions deploy create-checkout-session
npx supabase functions deploy stripe-webhook-handler
```

### Webhook Not Receiving Events
1. Check webhook URL is correct in Stripe Dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` is set in Supabase
3. Check Supabase Edge Function logs

### Payment Succeeds But No Booking Created
1. Check Supabase Edge Function logs for `stripe-webhook-handler`
2. Verify webhook secret is correct
3. Check database permissions (RLS policies)

### Test Payment Fails
- Ensure using test keys (`pk_test_` and `sk_test_`)
- Use Stripe test card: `4242 4242 4242 4242`
- Check browser console for errors

---

## 📝 Additional Stripe Test Cards

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 9995`
- **3D Secure**: `4000 0025 0000 3155`

---

## 🎯 Next Steps

1. ✅ Set up Stripe account
2. ✅ Get API keys
3. ✅ Configure Supabase secrets
4. ✅ Deploy Edge Functions
5. ✅ Add frontend environment variables
6. ✅ Test with test cards
7. ✅ Go live with real keys

---

## 💡 Tips

- **Always test in test mode first** before going live
- **Monitor Stripe Dashboard** for payments and issues
- **Check Supabase logs** if webhooks aren't working
- **Use Stripe CLI** for local webhook testing: `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook-handler`

---

## 📞 Support

If you encounter issues:
1. Check Stripe Dashboard → Developers → Logs
2. Check Supabase Dashboard → Edge Functions → Logs
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly
