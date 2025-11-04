# Admin Panel Complete Guide

## 🔐 Critical Security Requirement: 2FA is MANDATORY

**IMPORTANT**: Your admin panel requires Two-Factor Authentication (2FA/TOTP). This is hardcoded in `AdminLogin.tsx` (lines 118-133).

### What This Means:
- You **CANNOT** log in without 2FA enabled
- Even with correct email/password, login will fail if 2FA is not set up
- This is a security feature, not a bug

---

## 📋 What You Need to Access Admin Panel

### 1. **Create Admin Account**
- Go to: `https://ineedfilming.com/admin/login` (once SSL works)
- Enter email and password
- Click "Sign In"

### 2. **Assign Admin Role in Supabase**
```sql
-- Get your user ID first
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then assign admin role
INSERT INTO public.user_roles (user_id, role) 
VALUES ('YOUR_USER_ID_HERE', 'admin');
```

### 3. **Set Up 2FA (REQUIRED)**
After assigning admin role, you must enable 2FA:

#### Option A: Through Supabase Dashboard
1. Go to Supabase → Authentication → Users
2. Find your user
3. Enable MFA/TOTP
4. Scan QR code with Google Authenticator or Authy

#### Option B: Through Your App (if implemented)
1. Log in (will prompt for 2FA setup)
2. Scan QR code with authenticator app
3. Enter verification code

### 4. **Login Process**
1. Enter email + password
2. System checks for verified TOTP factor
3. If 2FA is set up → Enter 6-digit code
4. If NO 2FA → Login blocked with error: "2FA Required"

---

## 🎯 Admin Panel Features

### 18 Admin Pages Available:

1. **AdminDashboard** (`/admin/dashboard`)
   - KPI cards: Revenue, Bookings, Projects, Pipeline
   - Charts: Revenue trend, Status distribution
   - Quick stats with clickable cards

2. **AdminBookings** (`/admin/bookings`)
   - View all booking requests
   - Approve/Reject/Counter bookings
   - Status: pending, approved, countered, rejected

3. **AdminPipeline** (`/admin/pipeline`)
   - CRM Kanban board
   - Drag-and-drop leads
   - Stages: New → Contacted → Qualified → Proposal → Won/Lost

4. **AdminProjects** (`/admin/projects`)
   - Manage client projects
   - Track status, dates, budget
   - Link to episodes

5. **AdminEpisodePlanner** (`/admin/episode-planner`)
   - Multi-episode project management
   - Episode tracking: planning → filming → editing → delivered

6. **AdminClients** (`/admin/clients`)
   - Client management
   - View client accounts
   - Access client files

7. **AdminClientFiles** (`/admin/clients/:clientId/files`)
   - File management per client
   - Upload/download files

8. **AdminFiles** (`/admin/files`)
   - Global file management
   - Deliverable uploads

9. **AdminDeliverables** (route not shown but exists)
   - Manage video deliverables
   - Version control

10. **AdminDeliverableUpload** (exists in pages)
    - Upload new deliverables

11. **AdminDeliverableVersions** (exists in pages)
    - Version history

12. **AdminPayments** (`/admin/payments`)
    - Payment tracking
    - Invoice management

13. **AdminMeetings** (`/admin/meetings`)
    - Meeting scheduling
    - Google Calendar integration

14. **AdminMessages** (`/admin/messages`)
    - Messaging system
    - Client communication

15. **AdminSecurity** (`/admin/security`)
    - Security settings
    - MFA management

16. **AdminAuditLogs** (`/admin/audit-logs`)
    - Admin activity logging
    - Security audit trail

17. **AdminArchived** (`/admin/archived`)
    - Archived bookings
    - Soft-deleted items

---

## 🗄️ Database Tables Required

All created by `SUPABASE_COMPLETE_SETUP.sql`:

### Core Tables:
- ✅ `user_roles` - Admin/client role assignments
- ✅ `contacts` - Contact form submissions
- ✅ `projects` - Client projects
- ✅ `client_accounts` - Client portal access
- ✅ `episodes` - Episode planning data
- ✅ `custom_booking_requests` - Booking pipeline

### Additional Tables (from migrations):
- `opportunities` - CRM pipeline leads
- `payments` - Payment tracking
- `meetings` - Meeting scheduling
- `messages` - Messaging system
- `deliverables` - Video deliverables
- `files` - File storage metadata
- `failed_login_attempts` - Security logging
- `audit_logs` - Admin activity logs

---

## 🔄 Booking Pipeline Flow

### Status Flow:
```
pending → approved ✅
        → countered 🔄 (admin offers different price)
        → rejected ❌
```

### Admin Actions:
1. **View booking** in `/admin/bookings`
2. **Review details**: client info, requested price, project details
3. **Take action**:
   - **Approve**: Accept requested price
   - **Counter**: Offer different price
   - **Reject**: Decline booking
4. **Client receives email** notification
5. **Booking moves to appropriate status**

---

## 🎨 CRM Pipeline Stages

### Lead Stages:
1. **New** - Fresh lead
2. **Contacted** - Reached out
3. **Qualified** - Meets criteria
4. **Proposal** - Quote sent
5. **Won** - Deal closed ✅
6. **Lost** - Deal lost ❌

### Drag & Drop:
- Move cards between columns
- Automatically updates stage
- Tracks pipeline value

---

## 🚀 Quick Actions (Dashboard)

From dashboard, you can:
- **New Story Request** → `/admin/bookings`
- **Upload Episode** → `/admin/deliverables`
- **Message Founder** → `/admin/messages`

All KPI cards are clickable and navigate to relevant pages.

---

## 🔒 Security Features

### Built-in Security:
- ✅ **2FA/TOTP required** for admin access
- ✅ **Role-based access control** (RBAC)
- ✅ **Row Level Security** (RLS) on all tables
- ✅ **Session management** with auto-timeout
- ✅ **Failed login tracking**
- ✅ **Admin audit logs**
- ✅ **Bot protection** (honeypot)

### Protected Routes:
- All `/admin/*` routes require authentication + admin role
- `ProtectedRoute` component checks auth status
- Redirects to login if not authenticated

---

## 📊 Dashboard KPIs

### Metrics Tracked:
1. **Total Revenue** - Sum of approved bookings
2. **Founder Stories** - Total bookings (pending count shown)
3. **Episodes in Production** - Active projects
4. **Pipeline Value** - Sum of opportunity budgets

### Charts:
1. **Revenue Trend** - Line chart (last 6 months)
2. **Booking Status Distribution** - Pie chart

---

## ⚙️ What You Need to Do NOW

### Step 1: Fix SSL Certificate
- Switch to Netlify DNS, OR
- Contact Netlify support

### Step 2: Create Admin Account
1. Visit `https://ineedfilming.com/admin/login`
2. Sign up with your email/password

### Step 3: Assign Admin Role
```sql
-- In Supabase SQL Editor
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'your-email@example.com';
```

### Step 4: Enable 2FA
1. Go to Supabase → Authentication → Users
2. Find your user → Enable MFA
3. Scan QR code with authenticator app

### Step 5: Login
1. Go to `/admin/login`
2. Enter email + password
3. Enter 2FA code
4. Access admin panel!

---

## 🎯 Current Blockers

1. ❌ **SSL Certificate** - Site not accessible via HTTPS
2. ⏳ **Admin account** - Not created yet
3. ⏳ **Admin role** - Not assigned yet
4. ⏳ **2FA setup** - Not configured yet

**Once SSL is fixed, you can complete steps 2-5 in about 5 minutes!**

---

## 📞 Support

If you get stuck:
- Check browser console for errors
- Check Supabase logs
- Verify all environment variables are set in Netlify
- Ensure database tables are created (run SQL setup)

---

*Last Updated: November 4, 2025*
