import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 3000;

// Database connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Use SSL for external Railway connection
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  query_timeout: 30000,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Database connected:', res.rows[0].now);
  }
});

// Middleware - allow frontend and local dev via dynamic origin
app.use(cors({
  origin: true, // reflect request origin
  credentials: true,
}));

// Handle CORS preflight for all routes
app.options('*', cors({ origin: true, credentials: true }));

// Stripe webhook needs raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// JSON parser for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Import routes
import setupRoutes from './routes/setup.js';
import authRoutes from './routes/auth.js';
import mfaRoutes from './routes/mfa.js';
import bookingRoutes from './routes/bookings.js';
import newsletterRoutes from './routes/newsletter.js';
import stripeRoutes from './routes/stripe.js';
import clientRoutes from './routes/clients.js';
import projectRoutes from './routes/projects.js';
import fileRoutes from './routes/files.js';
import messageRoutes from './routes/messages.js';
import contactRoutes from './routes/contact.js';
import paymentRoutes from './routes/payments.js';
import meetingRoutes from './routes/meetings.js';
import opportunityRoutes from './routes/opportunities.js';
import deliverableRoutes from './routes/deliverables.js';
import calendarRoutes from './routes/calendar.js';

// Mount routes
app.use('/api/setup', setupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/mfa', mfaRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/deliverables', deliverableRoutes);
app.use('/api/calendar', calendarRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 NVision Films API running on port ${port}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});
