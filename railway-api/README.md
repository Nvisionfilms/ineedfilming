# NVision Films Railway API

Backend API for NVision Films built with Node.js, Express, and PostgreSQL on Railway.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database
Get your Railway PostgreSQL connection string from the Railway dashboard and set it in your environment variables.

Run the schema:
```bash
psql $DATABASE_URL < schema.sql
```

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - Railway PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens (generate a strong random string)
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `RESEND_API_KEY` - Resend API key for sending emails
- `R2_*` - Cloudflare R2 credentials (if using file storage)

### 4. Run Development Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/change-password` - Change password (requires auth)
- `POST /api/auth/logout` - Logout (requires auth)

### Newsletter
- `POST /api/newsletter/subscribe` - Subscribe to newsletter

### Bookings
- `GET /api/bookings` - Get all bookings (admin only)

### Clients
- `GET /api/clients` - Get all clients (admin only)

### Projects
- `GET /api/projects` - Get user's projects (requires auth)

### Files
- `GET /api/files/project/:projectId` - Get project files (requires auth)

### Messages
- `GET /api/messages` - Get user's messages (requires auth)

## Deployment to Railway

### From CLI
```bash
# Link to your Railway project
railway link

# Deploy
railway up
```

### From GitHub
1. Push code to GitHub
2. Connect repository in Railway dashboard
3. Railway will auto-deploy on push

## Database Schema

See `schema.sql` for the complete database schema including:
- Users & authentication
- Projects & bookings
- Payments
- Client accounts
- Messages
- Files
- Deliverables
- Newsletter subscribers
- Audit logs

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- SQL injection prevention (parameterized queries)
- Failed login attempt logging
- Audit logging for admin actions

## Next Steps

1. ✅ Set up Railway PostgreSQL database
2. ✅ Create API structure
3. ⏳ Deploy to Railway
4. ⏳ Set up Cloudflare R2 for file storage
5. ⏳ Configure Stripe webhooks
6. ⏳ Update frontend to use new API
7. ⏳ Test all endpoints
8. ⏳ Go live!
