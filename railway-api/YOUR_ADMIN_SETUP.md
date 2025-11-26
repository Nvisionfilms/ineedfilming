# Your Admin Account Setup

## ✅ Your Credentials Will Work!

I've set up the system to recreate your admin account with your exact credentials:

- **Email:** `da1unv45@gmail.com`
- **Password:** `BookNvision2026`

## 🔐 2FA/MFA Support - YES!

I've added full 2-Factor Authentication support using TOTP (Time-based One-Time Password), just like your current Supabase setup.

### How 2FA Works:

1. **Login with email/password** → API checks if MFA is enabled
2. **If MFA enabled** → API returns `mfaRequired: true`
3. **Enter 6-digit code** from your authenticator app
4. **API verifies code** → Returns JWT token

### MFA API Endpoints:

```
POST /api/mfa/enable          - Enable MFA (get QR code)
POST /api/mfa/verify-setup    - Verify setup with code
POST /api/mfa/verify-login    - Verify code during login
POST /api/mfa/disable         - Disable MFA
GET  /api/mfa/status          - Check if MFA is enabled
```

## 📋 Setup Steps

### Step 1: Install New Dependencies

```bash
cd railway-api
npm install
```

This will install the new MFA packages:
- `otplib` - For generating and verifying TOTP codes
- `qrcode` - For generating QR codes

### Step 2: Deploy to Railway

```bash
# Make sure you're in railway-api folder
railway up
```

### Step 3: Apply Database Schema

Use Railway dashboard:
1. Go to your PostgreSQL service
2. Click "Query" tab
3. Copy contents of `schema.sql`
4. Execute

### Step 4: Create Your Admin Account

After schema is applied, run:

```bash
# Set your DATABASE_URL environment variable
# (get it from: railway variables)

node create-admin.js
```

This will create your admin account with:
- Email: `da1unv45@gmail.com`
- Password: `BookNvision2026`
- Role: `admin`
- Email verified: `true`

## 🔒 Setting Up 2FA (After First Login)

### 1. Login First Time (No 2FA Yet)

```bash
POST /api/auth/login
{
  "email": "da1unv45@gmail.com",
  "password": "BookNvision2026"
}

Response:
{
  "user": { ... },
  "token": "eyJhbGc..."
}
```

### 2. Enable MFA

```bash
POST /api/mfa/enable
Headers: Authorization: Bearer <your-token>

Response:
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,...",
  "message": "Scan QR code with your authenticator app"
}
```

### 3. Scan QR Code

Use your authenticator app (Google Authenticator, Authy, etc.) to scan the QR code.

### 4. Verify Setup

```bash
POST /api/mfa/verify-setup
Headers: Authorization: Bearer <your-token>
{
  "code": "123456"  // 6-digit code from your app
}

Response:
{
  "message": "MFA successfully enabled"
}
```

### 5. Future Logins (With MFA)

```bash
# Step 1: Login with password
POST /api/auth/login
{
  "email": "da1unv45@gmail.com",
  "password": "BookNvision2026"
}

Response:
{
  "mfaRequired": true,
  "userId": "uuid-here",
  "message": "MFA verification required"
}

# Step 2: Verify MFA code
POST /api/mfa/verify-login
{
  "userId": "uuid-from-step-1",
  "code": "123456"  // Current code from app
}

Response:
{
  "user": { ... },
  "token": "eyJhbGc..."
}
```

## 🎨 Frontend Integration

### Login Component Update

```typescript
// 1. Initial login
const loginResponse = await apiCall('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});

// 2. Check if MFA required
if (loginResponse.mfaRequired) {
  // Show MFA input field
  setShowMfaInput(true);
  setUserId(loginResponse.userId);
  return;
}

// 3. If MFA not required, save token
localStorage.setItem('auth_token', loginResponse.token);
localStorage.setItem('user', JSON.stringify(loginResponse.user));

// 4. If MFA required, verify code
const verifyMfa = async (code: string) => {
  const response = await apiCall('/api/mfa/verify-login', {
    method: 'POST',
    body: JSON.stringify({ userId, code }),
  });
  
  localStorage.setItem('auth_token', response.token);
  localStorage.setItem('user', JSON.stringify(response.user));
  navigate('/admin/dashboard');
};
```

### MFA Settings Component

```typescript
// Enable MFA
const enableMfa = async () => {
  const response = await apiCall('/api/mfa/enable', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  
  // Show QR code to user
  setQrCode(response.qrCode);
  setSecret(response.secret);
};

// Verify setup
const verifySetup = async (code: string) => {
  await apiCall('/api/mfa/verify-setup', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ code }),
  });
  
  toast.success('2FA enabled successfully!');
};
```

## 🔄 Migration from Supabase Auth

### Key Differences:

| Feature | Supabase | Railway API |
|---------|----------|-------------|
| Auth Method | Supabase Auth | JWT Tokens |
| 2FA | Built-in MFA | TOTP (otplib) |
| Session Storage | Supabase handles | localStorage |
| Token Refresh | Auto | Manual (7 day expiry) |
| Password Reset | Email magic link | Custom implementation |

### What Stays the Same:

✅ Your email and password
✅ 2FA/MFA functionality
✅ Admin role and permissions
✅ Security level (bcrypt + TOTP)

### What Changes:

- Token format (JWT instead of Supabase token)
- API endpoints (your Railway URL)
- Frontend auth calls (use `apiCall` helper)

## 🚨 Important Security Notes

1. **Change Default Password**: After first login, change your password:
   ```bash
   POST /api/auth/change-password
   {
     "currentPassword": "BookNvision2026",
     "newPassword": "YourNewSecurePassword123!"
   }
   ```

2. **Enable 2FA Immediately**: Set up 2FA right after first login

3. **JWT Secret**: Make sure to set a strong `JWT_SECRET` in Railway environment variables

4. **HTTPS Only**: Railway provides HTTPS by default - never use HTTP in production

## 📝 Quick Reference

### Your Credentials:
```
Email: da1unv45@gmail.com
Password: BookNvision2026
```

### Create Admin Command:
```bash
node create-admin.js
```

### Test Login:
```bash
curl -X POST https://your-api.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"da1unv45@gmail.com","password":"BookNvision2026"}'
```

### Enable MFA:
```bash
curl -X POST https://your-api.up.railway.app/api/mfa/enable \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## ✅ Checklist

- [ ] Install dependencies (`npm install`)
- [ ] Deploy to Railway (`railway up`)
- [ ] Apply database schema
- [ ] Run `node create-admin.js`
- [ ] Test login with your credentials
- [ ] Enable 2FA
- [ ] Scan QR code with authenticator app
- [ ] Verify 2FA setup
- [ ] Test login with 2FA
- [ ] Change password (optional but recommended)

You're all set! Your exact credentials will work, and 2FA is fully supported! 🎉
