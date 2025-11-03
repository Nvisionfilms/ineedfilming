# NVision Films - Video Production Booking Funnel

> **Transform Your Story Into Strategy** - Professional video production booking system with integrated CRM, client portal, and payment processing.

## 🎬 Project Overview

**Website**: https://www.nvisionfilms.com  
**Version**: 1.0.0  
**Status**: Production Ready

NVision Films is a comprehensive video production business management platform featuring:
- 🎯 Multi-step booking funnel with Stripe integration
- 📊 Full-featured CRM with sales pipeline
- 👥 Client portal with file sharing and messaging
- 💰 Payment tracking and invoicing
- 📅 Meeting scheduling with Google Calendar sync
- 🔐 Enterprise-grade security (MFA, RBAC, audit logs)
- 📦 Deliverable management with version control

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ & npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Supabase account ([sign up free](https://supabase.com))
- Stripe account (optional, for payments)

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd nvision-funnels

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **React Router** - Client-side routing
- **TailwindCSS** - Utility-first CSS
- **shadcn/ui** - Component library (49 components)
- **Radix UI** - Accessible primitives
- **Lucide React** - Icon library
- **Recharts** - Data visualization

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (with MFA)
  - Row Level Security (RLS)
  - Edge Functions (12 functions)
  - Storage
  - Realtime subscriptions

### Integrations
- **Stripe** - Payment processing
- **Google Calendar** - Meeting scheduling
- **Resend** - Email notifications
- **OpenAI** - AI chatbot

## 📁 Project Structure

```
nvision-funnels/
├── components/          # React components (79 files)
│   ├── admin/          # Admin-specific components
│   ├── client/         # Client portal components
│   └── ui/             # shadcn/ui components
├── pages/              # Route pages (28 files)
│   ├── Admin*.tsx      # Admin pages (17)
│   ├── Client*.tsx     # Client pages (7)
│   └── Index.tsx       # Homepage
├── hooks/              # Custom React hooks
├── constants/          # Shared constants & configs
├── integrations/       # Supabase client & types
├── supabase/           # Backend configuration
│   ├── functions/      # Edge functions (12)
│   └── migrations/     # Database migrations (47)
└── lib/                # Utility functions
```

## 🔐 Security Features

- ✅ Multi-Factor Authentication (TOTP)
- ✅ Role-Based Access Control (admin/client/user)
- ✅ Row Level Security policies
- ✅ Session management with auto-timeout
- ✅ Admin audit logging
- ✅ Failed login tracking
- ✅ Bot protection (honeypot)
- ✅ Data masking for sensitive info
- ✅ Soft deletes for data recovery

## 📊 Key Features

### Public Features
- Landing page with episodic marketing positioning
- Multi-step booking form (Package → Date → Info → Payment)
- ROI calculator
- AI chatbot (Vision)
- Newsletter signup

### Admin Features
- Dashboard with KPIs and charts
- Booking management (approve/reject/counter)
- CRM pipeline (Kanban board)
- Project management
- Client management
- File management
- Deliverable versioning
- Payment tracking
- Meeting scheduling
- Messaging system
- Audit logs

### Client Features
- Personal dashboard
- File access and downloads
- Deliverable viewing with feedback
- Messaging with team
- Meeting management
- Storage upgrade options

## 🚀 Deployment

### Environment Variables Required

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key (optional)
```

### Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

### Deploy to Vercel/Netlify

1. Connect your Git repository
2. Set environment variables
3. Deploy!

The application is optimized for:
- Vercel (recommended)
- Netlify
- Any static hosting provider

## 📚 Documentation

- [Admin Setup Guide](./ADMIN_SETUP.md) - Set up your first admin user
- [Security Overview](./SECURITY_IMPROVEMENTS.md) - Security features & best practices
- [SEO Audit](./SEO_AUDIT.md) - SEO optimization details
- [Mobile Audit](./MOBILE_AUDIT.md) - Mobile responsiveness notes

## 🤝 Support

For questions or support:
- **Email**: support@nvisionfilms.com
- **Website**: https://www.nvisionfilms.com

## 📄 License

Proprietary - © 2025 NVision Films. All rights reserved.
