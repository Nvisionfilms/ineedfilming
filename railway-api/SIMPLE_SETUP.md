# Simple Setup - Just 3 Steps

## Step 1: Apply Database Schema

**Option A - Railway Dashboard (EASIEST):**
1. Go to: https://railway.com/project/eb70a39e-54f4-4d6c-a6f9-ee17edd0d848
2. Click **Postgres** service
3. Click **Query** tab
4. Open file: `e:\dg\nvision funnels\railway-api\schema.sql`
5. Copy EVERYTHING (Ctrl+A, Ctrl+C)
6. Paste into Railway Query window
7. Click **Execute** button
8. Wait for "Query executed successfully"

**Option B - Command Line:**
```bash
cd e:\dg\nvision funnels\railway-api
node setup-db.js
```

---

## Step 2: Create Your Admin Account

**In your terminal:**
```bash
cd e:\dg\nvision funnels\railway-api
node create-admin.js
```

This creates:
- Email: da1unv45@gmail.com
- Password: BookNvision2026
- Role: admin

---

## Step 3: Deploy API

**In your terminal:**
```bash
cd e:\dg\nvision funnels\railway-api
railway up
```

Wait for deployment to complete. You'll get a URL like:
`https://your-api.up.railway.app`

---

## Step 4: Test It Works

**Test login:**
```bash
curl -X POST https://your-api-url.up.railway.app/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"da1unv45@gmail.com\",\"password\":\"BookNvision2026\"}"
```

You should get back a token!

---

## If You Get Stuck:

**Check if schema applied:**
- Go to Railway → Postgres → Query
- Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
- Should see: users, projects, bookings, etc.

**Check if admin exists:**
- Run: `SELECT email, role FROM users;`
- Should see: da1unv45@gmail.com with role 'admin'

**Check API logs:**
```bash
railway logs
```

---

## That's It!

Once deployed, your API will be live at your Railway URL and you can login with your credentials.
