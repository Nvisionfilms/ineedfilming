# 🚨 Security Alert Resolution

## Issue
GitHub detected exposed Stripe webhook secret in `MIGRATION_STATUS.md` (commit 1123cc0f)

## Secrets That Were Exposed
- `STRIPE_WEBHOOK_SECRET=whsec_1mOcfhGFF958Eg0eOEDVaVxwvrDL6gIfv`
- `RESEND_API_KEY=re_Hy74KX9i_3aimKggRY1EnRg1qVyZ75rjL`
- `JWT_SECRET=nvision-films-super-secret-jwt-key-change-in-production-2025`

## ✅ Immediate Actions Taken
1. ✅ Removed secrets from `MIGRATION_STATUS.md`
2. ✅ Committed the fix

## ⚠️ CRITICAL: You Must Do These NOW

### 1. Rotate Stripe Webhook Secret (URGENT)
Go to Stripe Dashboard:
1. Navigate to: **Developers → Webhooks**
2. Find your webhook endpoint: `https://api-production-d1ca.up.railway.app/api/stripe/webhook`
3. Click **"Roll signing secret"** or delete and recreate the webhook
4. Copy the new `whsec_...` secret
5. Update it in Railway:
   ```bash
   # In Railway dashboard, update environment variable:
   STRIPE_WEBHOOK_SECRET=<new_secret_here>
   ```

### 2. Rotate Resend API Key
Go to Resend Dashboard:
1. Navigate to: **API Keys**
2. Delete the exposed key: `re_Hy74KX9i_3aimKggRY1EnRg1qVyZ75rjL`
3. Create a new API key
4. Update it in Railway:
   ```bash
   RESEND_API_KEY=<new_key_here>
   ```

### 3. Change JWT Secret
1. Generate a new strong secret:
   ```bash
   # Use this or similar
   openssl rand -base64 32
   ```
2. Update in Railway:
   ```bash
   JWT_SECRET=<new_secret_here>
   ```
3. **Note:** This will log out all users

### 4. Remove Secrets from Git History

**Option A: Using git filter-repo (Recommended)**
```powershell
# Install git-filter-repo if not installed
# Download from: https://github.com/newren/git-filter-repo

# Create a backup first
git clone --mirror https://github.com/Nvisionfilms/ineedfilming.git backup-repo

# Remove the file from history
git filter-repo --path MIGRATION_STATUS.md --invert-paths --force

# Or replace the secrets in the file
git filter-repo --replace-text secrets.txt --force
```

**Option B: Using BFG Repo Cleaner (Easier)**
```powershell
# Download BFG from: https://rtyley.github.io/bfg-repo-cleaner/
# Then run:
java -jar bfg.jar --replace-text secrets.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

**secrets.txt content:**
```
whsec_1mOcfhGFF958Eg0eOEDVaVxwvrDL6gIfv==>***REMOVED***
re_Hy74KX9i_3aimKggRY1EnRg1qVyZ75rjL==>***REMOVED***
nvision-films-super-secret-jwt-key-change-in-production-2025==>***REMOVED***
```

### 5. Force Push (After Rotating Secrets!)
```powershell
# Only do this AFTER rotating all secrets above
git push origin --force --all
git push origin --force --tags
```

## 📋 Checklist

- [ ] Rotate Stripe webhook secret in Stripe Dashboard
- [ ] Update `STRIPE_WEBHOOK_SECRET` in Railway
- [ ] Delete and recreate Resend API key
- [ ] Update `RESEND_API_KEY` in Railway
- [ ] Generate new JWT secret
- [ ] Update `JWT_SECRET` in Railway
- [ ] Remove secrets from git history using BFG or filter-repo
- [ ] Force push to GitHub (ONLY after rotating secrets)
- [ ] Verify Railway app still works
- [ ] Close GitHub security alert

## 🔒 Prevention

Going forward:
1. **Never commit secrets** - Use environment variables only
2. **Use .env files** - Add `.env` to `.gitignore`
3. **Use placeholders** in documentation like `<your_secret_here>`
4. **Enable GitHub secret scanning** (already enabled)
5. **Review commits** before pushing

## Status
- ✅ Secrets removed from current code
- ⏳ Waiting for you to rotate secrets
- ⏳ Waiting for git history cleanup
- ⏳ Waiting for force push

**DO NOT SKIP THE ROTATION STEP!** The secrets are public now and must be invalidated.
