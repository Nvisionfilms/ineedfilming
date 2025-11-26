# 🔧 Netlify Environment Variables Update

## Current Netlify Variables (To Remove/Update)

### ❌ Remove These (Supabase - No Longer Needed)
```
VITE_SUPABASE_PROJECT_ID=tkkfatwpzjzzoszjiigd
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_URL=https://tkkfatwpzjzzoszjiigd.supabase.co
```

### ✅ Keep These (Already Correct)
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51IJbQSIk5yHgcjhl0aMH8Ticv3fxYAhaK2cuPpDl8SZjdAxvajQ0DWM0qNVVDU4u6jNYa770kfBxu9qHHBlSQ8du00sj0prrwn
```

### ➕ Add This (Railway API)
```
VITE_API_URL=https://api-production-d1ca.up.railway.app
```

---

## Step-by-Step Instructions

### Option 1: Via Netlify Dashboard (Recommended)

1. Go to: https://app.netlify.com/sites/nvisionfilms/settings/env

2. **Delete these variables:**
   - Click "Options" → "Delete" for each:
     - `VITE_SUPABASE_PROJECT_ID`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`
     - `VITE_SUPABASE_URL`

3. **Add new variable:**
   - Click "Add a variable"
   - Key: `VITE_API_URL`
   - Value: `https://api-production-d1ca.up.railway.app`
   - Scopes: All (Production, Deploy Previews, Branch deploys, etc.)
   - Click "Create variable"

4. **Verify Stripe key exists:**
   - Confirm `VITE_STRIPE_PUBLISHABLE_KEY` is set
   - Value should be: `pk_live_51IJbQSIk5yHgcjhl0aMH8Ticv3fxYAhaK2cuPpDl8SZjdAxvajQ0DWM0qNVVDU4u6jNYa770kfBxu9qHHBlSQ8du00sj0prrwn`

5. **Trigger new deploy:**
   - Go to "Deploys" tab
   - Click "Trigger deploy" → "Deploy site"

---

### Option 2: Via Netlify CLI

```bash
# Navigate to project
cd "e:\dg\nvision funnels"

# Delete Supabase variables
netlify env:unset VITE_SUPABASE_PROJECT_ID
netlify env:unset VITE_SUPABASE_PUBLISHABLE_KEY
netlify env:unset VITE_SUPABASE_URL

# Add Railway API URL
netlify env:set VITE_API_URL "https://api-production-d1ca.up.railway.app"

# Deploy
netlify deploy --prod
```

---

## Final Environment Variables (After Update)

Your Netlify site should have exactly these 2 variables:

```
VITE_API_URL=https://api-production-d1ca.up.railway.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51IJbQSIk5yHgcjhl0aMH8Ticv3fxYAhaK2cuPpDl8SZjdAxvajQ0DWM0qNVVDU4u6jNYa770kfBxu9qHHBlSQ8du00sj0prrwn
```

---

## Verification

After deploying, test:

1. **Login Test:**
   - Visit: https://nvisionfilms.netlify.app/admin/login
   - Login with: da1unv45@gmail.com / BookNvision2026
   - Should redirect to admin dashboard

2. **API Connection:**
   - Open browser console (F12)
   - Check Network tab
   - Should see requests to `https://api-production-d1ca.up.railway.app`
   - No requests to `supabase.co`

3. **Stripe Test:**
   - Test a payment flow
   - Should redirect to Stripe checkout
   - Webhook should create booking in Railway database

---

## Troubleshooting

### If login fails:
- Check browser console for errors
- Verify `VITE_API_URL` is set correctly
- Test API directly: https://api-production-d1ca.up.railway.app/health

### If Stripe fails:
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` matches Railway's secret key
- Check Stripe webhook is pointing to Railway
- Review Railway logs: `railway logs`

### If build fails:
- Clear Netlify cache and retry
- Check build logs for missing dependencies
- Verify all imports are correct
