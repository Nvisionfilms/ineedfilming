# Migration Guide: Supabase to Railway

## Overview
This guide will help you migrate your NVision Films application from Supabase to Railway. Your application currently uses:

- **PostgreSQL Database** (with 47 migrations)
- **Supabase Auth** (authentication & user management)
- **Supabase Storage** (file storage buckets)
- **Edge Functions** (15 serverless functions)

---

## What You'll Need on Railway

### 1. PostgreSQL Database
Railway provides managed PostgreSQL instances.

### 2. Authentication Replacement
Since Railway doesn't provide auth out-of-the-box, you'll need to choose:
- **Option A:** Keep using Supabase Auth (hybrid approach - only auth stays on Supabase)
- **Option B:** Implement custom auth with JWT tokens
- **Option C:** Use a third-party auth service (Auth0, Clerk, etc.)

### 3. File Storage Replacement
Railway doesn't provide object storage, so you'll need:
- **Option A:** AWS S3
- **Option B:** Cloudflare R2 (S3-compatible, cheaper)
- **Option C:** DigitalOcean Spaces (S3-compatible)
- **Option D:** Backblaze B2

### 4. Edge Functions Replacement
Convert Supabase Edge Functions to:
- **Option A:** Railway services (Node.js/Express API)
- **Option B:** Vercel/Netlify Functions (keep functions separate)

---

## Migration Steps

### Phase 1: Set Up Railway Infrastructure

#### Step 1.1: Create Railway Project
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway init
```

#### Step 1.2: Provision PostgreSQL Database
1. Go to Railway dashboard
2. Click "New" → "Database" → "PostgreSQL"
3. Note the connection string (format: `postgresql://user:pass@host:port/db`)

#### Step 1.3: Export Supabase Database
```bash
# Export your Supabase database schema and data
npx supabase db dump --data-only > supabase_data.sql
npx supabase db dump --schema > supabase_schema.sql

# Or use pg_dump directly with your Supabase connection string
pg_dump "postgresql://postgres:[YOUR-PASSWORD]@db.tkkfatwpzjzzoszjiigd.supabase.co:5432/postgres" > full_backup.sql
```

#### Step 1.4: Import to Railway PostgreSQL
```bash
# Connect to Railway PostgreSQL and import
psql [RAILWAY_DATABASE_URL] < supabase_schema.sql
psql [RAILWAY_DATABASE_URL] < supabase_data.sql
```

---

### Phase 2: Handle Authentication

#### Option A: Keep Supabase Auth (Recommended for Quick Migration)
**Pros:** Minimal code changes, keep all auth features
**Cons:** Still dependent on Supabase for one service

1. Keep using `@supabase/supabase-js` for auth only
2. Point database queries to Railway PostgreSQL
3. Update `integrations/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

// Supabase for auth only
export const supabaseAuth = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public'
    }
  }
);

// Direct PostgreSQL connection for data (via your API)
// You'll query Railway DB through your own API endpoints
```

#### Option B: Custom JWT Auth (Full Independence)
**Pros:** Complete control, no Supabase dependency
**Cons:** More work, need to implement MFA, password reset, etc.

1. Install dependencies:
```bash
npm install jsonwebtoken bcrypt express-rate-limit
```

2. Create auth service on Railway
3. Migrate auth.users table data
4. Implement JWT token generation/validation
5. Update all auth calls in your frontend

---

### Phase 3: Migrate File Storage

#### Recommended: Cloudflare R2 (S3-Compatible, Cost-Effective)

1. **Create Cloudflare R2 Account**
   - Sign up at cloudflare.com
   - Navigate to R2 Object Storage
   - Create buckets:
     - `nvision-project-shared-files`
     - `nvision-project-private-files`
     - `nvision-project-deliverables`

2. **Get R2 Credentials**
   - Create API token with R2 permissions
   - Note: Access Key ID, Secret Access Key, Bucket endpoint

3. **Install AWS SDK** (R2 is S3-compatible):
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

4. **Create Storage Service** (`lib/storage.ts`):
```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT, // e.g., https://[account-id].r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadFile(bucket: string, key: string, file: Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file,
    ContentType: contentType,
  });
  
  return await s3Client.send(command);
}

export async function getSignedDownloadUrl(bucket: string, key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  
  return await getSignedUrl(s3Client, command, { expiresIn });
}
```

5. **Migrate Existing Files**
   - Download all files from Supabase Storage buckets
   - Upload to R2 using the storage service
   - Update file paths in `project_files` table

---

### Phase 4: Convert Edge Functions to Railway Services

You have 15 Edge Functions to migrate. Create a Node.js/Express API on Railway.

#### Step 4.1: Create API Service Structure
```bash
mkdir railway-api
cd railway-api
npm init -y
npm install express cors dotenv pg stripe resend
npm install -D typescript @types/express @types/node ts-node
```

#### Step 4.2: Create Express Server (`railway-api/src/index.ts`)
```typescript
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import Stripe from 'stripe';
import { Resend } from 'resend';

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Initialize services
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-11-20.acacia' });
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Import routes
import { newsletterRoutes } from './routes/newsletter';
import { bookingRoutes } from './routes/bookings';
import { stripeRoutes } from './routes/stripe';
import { clientRoutes } from './routes/clients';

app.use('/api/newsletter', newsletterRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/clients', clientRoutes);

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});
```

#### Step 4.3: Convert Each Edge Function

**Example: submit-newsletter**

Original Supabase Function:
```typescript
// supabase/functions/submit-newsletter/index.ts
serve(async (req) => {
  const { email, name } = await req.json();
  // ... logic
});
```

New Railway Route:
```typescript
// railway-api/src/routes/newsletter.ts
import { Router } from 'express';
import { Resend } from 'resend';

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/subscribe', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    // Insert into database
    const result = await pool.query(
      'INSERT INTO newsletter_subscribers (email, name) VALUES ($1, $2) RETURNING *',
      [email, name]
    );
    
    // Send welcome email
    await resend.emails.send({
      from: "NVISION FILMS LLC <contact@nvisionfilms.com>",
      to: [email],
      subject: "Welcome to NVISION FILMS LLC",
      html: `...` // Your email template
    });
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as newsletterRoutes };
```

#### Step 4.4: Deploy API to Railway
```bash
# In railway-api directory
railway up
```

---

### Phase 5: Update Frontend Configuration

#### Step 5.1: Update Environment Variables
Create `.env` file:
```env
# Railway PostgreSQL (accessed via your API)
VITE_API_URL=https://your-railway-api.up.railway.app

# If keeping Supabase Auth
VITE_SUPABASE_URL=https://tkkfatwpzjzzoszjiigd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key

# Stripe (no change)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

#### Step 5.2: Create API Client
```typescript
// lib/api-client.ts
const API_URL = import.meta.env.VITE_API_URL;

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
}
```

#### Step 5.3: Replace Supabase Calls
**Before:**
```typescript
const { data, error } = await supabase
  .from('newsletter_subscribers')
  .insert({ email, name });
```

**After:**
```typescript
const data = await apiCall('/api/newsletter/subscribe', {
  method: 'POST',
  body: JSON.stringify({ email, name }),
});
```

---

### Phase 6: Testing & Validation

#### Checklist:
- [ ] Database connection works
- [ ] All migrations applied successfully
- [ ] Authentication flow works (login/logout/signup)
- [ ] File uploads work to new storage
- [ ] File downloads work with signed URLs
- [ ] All API endpoints respond correctly
- [ ] Email sending works (newsletter, bookings, etc.)
- [ ] Stripe webhooks configured to new endpoint
- [ ] Admin portal functions correctly
- [ ] Client portal functions correctly
- [ ] MFA/2FA still works (if using Supabase Auth)

---

## Environment Variables Needed

### Railway API Service
```env
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
R2_ENDPOINT=https://...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_SHARED=nvision-project-shared-files
R2_BUCKET_PRIVATE=nvision-project-private-files
R2_BUCKET_DELIVERABLES=nvision-project-deliverables
JWT_SECRET=your_jwt_secret (if using custom auth)
```

### Frontend (Vite)
```env
VITE_API_URL=https://your-railway-api.up.railway.app
VITE_SUPABASE_URL=... (if keeping Supabase Auth)
VITE_SUPABASE_PUBLISHABLE_KEY=... (if keeping Supabase Auth)
VITE_STRIPE_PUBLISHABLE_KEY=pk_...
```

---

## Cost Comparison

### Current Supabase (Estimated)
- Pro Plan: ~$25/month
- Storage: Variable
- Functions: Included
- **Total: ~$25-50/month**

### Railway Setup (Estimated)
- PostgreSQL: ~$5/month (Hobby plan)
- API Service: ~$5/month (Hobby plan)
- Cloudflare R2: ~$0.015/GB storage + $0.36/million requests
- **Total: ~$10-20/month** (plus R2 usage)

---

## Recommended Migration Path

### Option 1: Hybrid (Fastest)
1. Move database to Railway PostgreSQL
2. Keep Supabase Auth
3. Move storage to Cloudflare R2
4. Convert functions to Railway API
5. **Time: 1-2 days**

### Option 2: Full Migration (Complete Independence)
1. Move database to Railway PostgreSQL
2. Implement custom JWT auth
3. Move storage to Cloudflare R2
4. Convert functions to Railway API
5. **Time: 3-5 days**

---

## Rollback Plan

If something goes wrong:
1. Keep Supabase running during migration
2. Test Railway setup thoroughly before switching
3. Use feature flags to toggle between Supabase/Railway
4. Keep database backups from both platforms
5. DNS/API URL can be switched back instantly

---

## Next Steps

1. **Decide on auth strategy** (Hybrid vs Full Migration)
2. **Set up Railway account** and provision PostgreSQL
3. **Export Supabase data** (database + files)
4. **Create Railway API service** structure
5. **Migrate functions one by one** and test
6. **Update frontend** to use new API
7. **Test thoroughly** in staging environment
8. **Switch DNS/environment variables** to production
9. **Monitor for issues** for 48 hours
10. **Decommission Supabase** once stable

---

## Support Resources

- Railway Docs: https://docs.railway.app
- Cloudflare R2 Docs: https://developers.cloudflare.com/r2
- PostgreSQL Migration: https://www.postgresql.org/docs/current/backup-dump.html

---

## Questions to Answer Before Starting

1. **Do you want to keep Supabase Auth or go fully independent?**
2. **What's your preferred file storage? (R2, S3, Spaces)**
3. **Do you have a Railway account already?**
4. **What's your timeline for this migration?**
5. **Do you need help with any specific part?**

Let me know your answers and I can help you execute the migration!
