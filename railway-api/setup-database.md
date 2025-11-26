# Database Setup Instructions

## Get Your Railway Database URL

Run this command:
```bash
railway variables
```

Look for `DATABASE_URL` - copy the entire connection string.

## Apply Schema

### Option 1: Using Railway Dashboard
1. Go to https://railway.com/project/eb70a39e-54f4-4d6c-a6f9-ee17edd0d848
2. Click on your Postgres service
3. Go to "Query" tab
4. Copy the contents of `schema.sql` and paste it
5. Click "Execute"

### Option 2: Using pgAdmin or DBeaver
1. Install pgAdmin (https://www.pgadmin.org/) or DBeaver (https://dbeaver.io/)
2. Create new connection with your DATABASE_URL
3. Open `schema.sql` file
4. Execute the script

### Option 3: Using psql (if installed)
```bash
# Replace with your actual DATABASE_URL from Railway
psql "postgresql://postgres:password@host.railway.app:5432/railway" < schema.sql
```

## Verify Schema

After applying, verify tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see these tables:
- users
- projects
- bookings
- payments
- client_accounts
- messages
- project_files
- deliverables
- newsletter_subscribers
- audit_logs
- failed_login_attempts
- meetings

## Create Your First Admin User

After schema is applied, you'll create your admin account through the API after deployment.

The schema includes a placeholder admin user, but you should create your own with a secure password.
