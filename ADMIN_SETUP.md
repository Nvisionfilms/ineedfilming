# Admin Setup Instructions

## Setting Up Your First Admin User

After implementing the secure authentication system, you need to assign the admin role to your user account.

### Step 1: Create Your Admin Account

1. Click the "Admin" link in the footer
2. You'll be redirected to `/admin/login`
3. Click "Need an account? Sign up"
4. Create your account with your email and password

### Step 2: Assign Admin Role

You need to manually assign the admin role to your account using the backend dashboard.

<lov-actions>
  <lov-open-backend>Open Backend Dashboard</lov-open-backend>
</lov-actions>

**In the Backend Dashboard:**

1. Go to **Table Editor**
2. Select the `user_roles` table
3. Click **Insert row**
4. Fill in:
   - `user_id`: Your user ID (find it in the `auth.users` table or `profiles` table)
   - `role`: Select `admin` from the dropdown
5. Click **Save**

### Step 3: Verify Access

1. Go back to `/admin/login`
2. Sign in with your credentials
3. You should now have access to `/admin/bookings`

## SQL Method (Alternative)

You can also assign admin role using SQL in the SQL Editor:

```sql
-- Replace 'your-email@example.com' with your actual email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'your-email@example.com';
```

## Security Notes

- ✅ **No hardcoded passwords** - All authentication uses Supabase Auth
- ✅ **Role-based access** - Roles stored in separate table for security
- ✅ **Protected routes** - Admin routes check authentication + role
- ✅ **Session-based** - Uses secure JWT tokens
- ✅ **Auto-confirm enabled** - For faster testing (can be disabled in production)

## Managing Additional Admins

To add more admin users, repeat Step 2 for each new admin account.
