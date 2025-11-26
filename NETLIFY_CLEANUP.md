# 🧹 Netlify Environment Variables Cleanup

## Current State (Causing Confusion)
Your Netlify has BOTH Supabase and Railway variables, causing conflicts.

## ✅ What to Keep

**Keep these 2 variables:**
```
VITE_API_URL=https://api-production-d1ca.up.railway.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51IJbQSIk5yHgcjhl0aMH8Ticv3fxYAhaK2cuPpDl8SZjdAxvajQ0DWM0qNVVDU4u6jNYa770kfBxu9qHHBlSQ8du00sj0prrwn
```

## ❌ Delete These (Supabase - No Longer Needed)

**Delete all of these:**
```
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_URL
```

## 📋 Step-by-Step Instructions

### 1. Go to Netlify Environment Variables
https://app.netlify.com/sites/nvisionfilms/settings/env

### 2. Add Railway API URL (if not already added)
- Click "Add a variable"
- Key: `VITE_API_URL`
- Value: `https://api-production-d1ca.up.railway.app`
- Scopes: All (check all boxes)
- Click "Create variable"

### 3. Delete Supabase Variables
For each Supabase variable:
- Click "Options" (three dots)
- Click "Delete"
- Confirm deletion

Delete:
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`

### 4. Verify Final State
You should have ONLY these 2 variables:
- ✅ `VITE_API_URL`
- ✅ `VITE_STRIPE_PUBLISHABLE_KEY`

### 5. Redeploy
- Go to "Deploys" tab
- Click "Trigger deploy"
- Select "Clear cache and deploy site"
- Wait for build to complete

## 🎯 After Cleanup

Your site will use ONLY Railway for:
- ✅ Authentication
- ✅ Database
- ✅ Stripe payments
- ✅ All API calls

No more Supabase confusion!
