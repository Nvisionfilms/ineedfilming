# Complete Setup Instructions

## ✅ What We've Done So Far:

1. ✅ Updated `.env` with your new Supabase credentials
2. ✅ Built the project with new credentials
3. ✅ Created complete SQL setup file

## 📋 What You Need to Do Next:

### Step 1: Set Up Supabase Database (5 minutes)

1. **Go to** [supabase.com](https://supabase.com) and sign in
2. **Open your project**: `tkkfatwpzjzzoszjiigd`
3. **Go to SQL Editor** (left sidebar)
4. **Click "New Query"**
5. **Open the file** `SUPABASE_COMPLETE_SETUP.sql` in this folder
6. **Copy all the SQL** and paste it into the Supabase SQL Editor
7. **Click "Run"** (or press Ctrl+Enter)
8. **Wait for success message** - all tables will be created!

### Step 2: Deploy Updated Code to Netlify (2 minutes)

```powershell
# In your terminal, run these commands:
git add .
git commit -m "Update Supabase credentials"
git push origin main
```

Netlify will automatically detect the push and deploy the updated code.

### Step 3: Create Your First Admin User (3 minutes)

1. **Wait for Netlify deployment** to finish (check Netlify dashboard)
2. **Once SSL certificate is provisioned**, visit `https://ineedfilming.com/admin`
3. **Sign up** with your email and password
4. **Go back to Supabase** → **Authentication** → **Users**
5. **Copy your User ID** (looks like: `a1b2c3d4-...`)
6. **Go to SQL Editor** and run this (replace YOUR_USER_ID):
   ```sql
   INSERT INTO public.user_roles (user_id, role) VALUES ('YOUR_USER_ID', 'admin');
   ```
7. **Refresh the admin page** - you should now have admin access!

### Step 4: Verify Everything Works

- ✅ Contact form submissions save to `contacts` table
- ✅ Admin login works
- ✅ Client portal works
- ✅ Projects and episodes can be created

## 🔧 Current Status:

### DNS & SSL:
- ⏳ **Waiting for SSL certificate** to provision in Netlify
- ✅ DNS is correctly configured
- ✅ Domain is reaching Netlify

### Supabase:
- ✅ New credentials configured
- ⏳ **Need to run SQL setup** (Step 1 above)
- ⏳ **Need to create admin user** (Step 3 above)

### Deployment:
- ✅ Code built successfully
- ⏳ **Need to push to GitHub** (Step 2 above)

## 📞 Need Help?

If you get stuck:
1. Check Netlify deployment logs
2. Check browser console for errors
3. Check Supabase logs in Dashboard → Logs

## 🎯 Priority Order:

1. **First**: Check if SSL certificate is provisioned in Netlify
2. **Second**: Run the SQL setup in Supabase
3. **Third**: Push code to GitHub
4. **Fourth**: Create admin user once site is live
