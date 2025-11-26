# 🚀 Railway Quick Start Guide - NVision Films

You've successfully set up the foundation! Here's what we've done and what's next.

## ✅ What's Been Set Up

### 1. Railway Project Created
- Project: `distinguished-quietude`
- URL: https://railway.com/project/eb70a39e-54f4-4d6c-a6f9-ee17edd0d848
- PostgreSQL database provisioned

### 2. API Structure Created
```
railway-api/
├── src/
│   ├── index.ts              # Main Express server
│   ├── middleware/
│   │   └── auth.ts           # JWT authentication
│   └── routes/
│       ├── auth.ts           # Login, register, password management
│       ├── newsletter.ts     # Newsletter subscriptions
│       ├── bookings.ts       # Booking management
│       ├── clients.ts        # Client management
│       ├── projects.ts       # Project management
│       ├── files.ts          # File management
│       ├── messages.ts       # Messaging system
│       └── stripe.ts         # Stripe integration
├── schema.sql                # Complete database schema
├── package.json              # Dependencies installed ✅
└── README.md                 # API documentation
```

## 📋 Next Steps

### Step 1: Set Up Database Schema

Get your Railway database connection string:
```bash
cd railway-api
railway variables
```

Look for `DATABASE_URL` - it will look like:
```
postgresql://postgres:password@host.railway.app:5432/railway
```

Apply the schema:
```bash
# Option A: Using Railway CLI
railway run psql < schema.sql

# Option B: Direct connection
psql "postgresql://postgres:password@host.railway.app:5432/railway" < schema.sql
```

### Step 2: Set Environment Variables in Railway

Go to your Railway project dashboard and add these variables:

**Required:**
```
DATABASE_URL=<already set by Railway>
JWT_SECRET=<generate a strong random string>
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://nvisionfilms.netlify.app
```

**For Email (Resend):**
```
RESEND_API_KEY=re_your_key_here
```

**For Stripe:**
```
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
```

**For File Storage (Cloudflare R2 - set up later):**
```
R2_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_SHARED=nvision-project-shared-files
R2_BUCKET_PRIVATE=nvision-project-private-files
R2_BUCKET_DELIVERABLES=nvision-project-deliverables
```

### Step 3: Deploy API to Railway

```bash
cd railway-api
railway up
```

This will:
- Build your TypeScript code
- Deploy to Railway
- Give you a public URL like: `https://your-api.up.railway.app`

### Step 4: Create Your Admin Account

Once deployed, create your admin account:

```bash
# Using curl (replace URL with your Railway API URL)
curl -X POST https://your-api.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nvisionfilms.com",
    "password": "YourSecurePassword123!",
    "fullName": "Eric Sattler",
    "role": "admin"
  }'
```

Or use Postman/Insomnia to make the request.

### Step 5: Test the API

```bash
# Health check
curl https://your-api.up.railway.app/health

# Login
curl -X POST https://your-api.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nvisionfilms.com",
    "password": "YourSecurePassword123!"
  }'
```

You should get back a JWT token!

## 🔧 Local Development

To run locally:

```bash
cd railway-api

# Copy environment variables
cp .env.example .env

# Edit .env with your Railway DATABASE_URL and other keys
nano .env

# Run development server
npm run dev
```

Server will start on http://localhost:3000

## 📁 File Storage Setup (Cloudflare R2)

### 1. Create Cloudflare Account
- Go to https://cloudflare.com
- Sign up / Log in
- Navigate to R2 Object Storage

### 2. Create Buckets
Create these three buckets:
- `nvision-project-shared-files`
- `nvision-project-private-files`
- `nvision-project-deliverables`

### 3. Get API Credentials
- Go to R2 → Manage R2 API Tokens
- Create API token with Read & Write permissions
- Copy:
  - Access Key ID
  - Secret Access Key
  - Endpoint URL

### 4. Add to Railway Environment Variables
Add the R2 variables listed in Step 2 above.

## 🎨 Update Frontend

Once your API is deployed, update your frontend:

### 1. Create API Client

Create `src/lib/api-client.ts`:
```typescript
const API_URL = import.meta.env.VITE_API_URL;

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  
  return response.json();
}
```

### 2. Update Environment Variables

Add to your `.env`:
```
VITE_API_URL=https://your-api.up.railway.app
```

### 3. Replace Supabase Calls

**Before (Supabase):**
```typescript
const { data, error } = await supabase
  .from('newsletter_subscribers')
  .insert({ email, name });
```

**After (Railway API):**
```typescript
const data = await apiCall('/api/newsletter/subscribe', {
  method: 'POST',
  body: JSON.stringify({ email, name }),
});
```

## 🔐 Authentication Flow

### Login Flow:
1. User submits email/password
2. API validates and returns JWT token
3. Frontend stores token in localStorage
4. Frontend includes token in Authorization header for protected requests

### Example Login Component Update:
```typescript
// Before (Supabase)
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// After (Railway)
const { user, token } = await apiCall('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});

localStorage.setItem('auth_token', token);
localStorage.setItem('user', JSON.stringify(user));
```

## 📊 Monitoring

### Railway Dashboard
- View logs: `railway logs`
- View metrics: Check Railway dashboard
- View database: `railway connect postgres`

### Health Checks
Your API has a health endpoint:
```
GET /health
```

Returns:
```json
{
  "status": "ok",
  "timestamp": "2025-11-25T...",
  "environment": "production"
}
```

## 🚨 Troubleshooting

### Database Connection Issues
```bash
# Test database connection
railway connect postgres

# View connection string
railway variables | grep DATABASE_URL
```

### API Not Starting
```bash
# View logs
railway logs

# Common issues:
# - Missing environment variables
# - Database schema not applied
# - Port conflicts
```

### JWT Token Issues
- Make sure `JWT_SECRET` is set in Railway
- Token expires after 7 days by default
- Frontend must send token in `Authorization: Bearer <token>` header

## 📝 TODO Checklist

- [ ] Apply database schema to Railway PostgreSQL
- [ ] Set all environment variables in Railway
- [ ] Deploy API to Railway
- [ ] Create admin account
- [ ] Test API endpoints
- [ ] Set up Cloudflare R2 buckets
- [ ] Update frontend API client
- [ ] Replace Supabase auth calls
- [ ] Replace Supabase database calls
- [ ] Replace Supabase storage calls
- [ ] Test complete user flow
- [ ] Update Stripe webhook URL
- [ ] Go live!

## 💰 Cost Estimate

### Railway
- Hobby Plan: $5/month (PostgreSQL + API service)
- Pro Plan: $20/month (if you need more resources)

### Cloudflare R2
- Storage: $0.015/GB/month
- Class A Operations: $4.50/million requests
- Class B Operations: $0.36/million requests
- **Estimated: $1-5/month** for typical usage

### Total: ~$6-25/month
**Savings vs Supabase: 50-75%**

## 🆘 Need Help?

Common commands:
```bash
# View Railway logs
railway logs

# Connect to database
railway connect postgres

# View environment variables
railway variables

# Deploy changes
railway up

# Run local development
npm run dev
```

## 🎉 You're Ready!

Your Railway infrastructure is set up. Follow the steps above to:
1. Apply the database schema
2. Set environment variables
3. Deploy the API
4. Update your frontend

Let me know when you're ready for the next step!
