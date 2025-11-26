# 🚀 Railway Database Setup Instructions

## Your Railway Connection Details:
- **Host**: shortline.proxy.rlwy.net
- **Port**: 43172
- **Database**: railway
- **User**: postgres

## 🎯 **EASIEST METHOD: Railway CLI**

### Step 1: Install Railway CLI (if not installed)
```powershell
npm install -g @railway/cli
```

### Step 2: Login to Railway
```powershell
railway login
```

### Step 3: Connect to your database
```powershell
railway connect Postgres
```

### Step 4: Once connected, paste this command:
```sql
\i 'e:/dg/nvision funnels/railway-api/COMPLETE_SUPABASE_SCHEMA.sql'
```

Or copy/paste the entire SQL file content directly!

---

## 📋 **ALTERNATIVE: Using PowerShell Script**

### If you have PostgreSQL installed:
```powershell
cd "e:\dg\nvision funnels\railway-api"
.\run-schema.ps1
```

---

## 🖥️ **MANUAL METHOD: Railway Dashboard**

1. Go to Railway Dashboard
2. Click your PostgreSQL service
3. Click **"Data"** tab
4. Click **"Query"** button
5. Open `COMPLETE_SUPABASE_SCHEMA.sql`
6. Copy ALL the content
7. Paste into Railway Query editor
8. Click **"Run"**

---

## ✅ **Verify Tables Created**

After running the SQL, verify with:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see 23 tables!

---

## 🎉 **After Setup Complete:**
Continue with frontend migration - we're at 8/29 pages (28% done)!
