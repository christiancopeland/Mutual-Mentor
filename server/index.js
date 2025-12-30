import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { initializeDatabase } from './db/index.js'
import './db/seed.js'
import clientsRouter from './routes/clients.js'
import metricsRouter from './routes/metrics.js'
import goalsRouter from './routes/goals.js'
import bonusesRouter from './routes/bonuses.js'
import dashboardRouter from './routes/dashboard.js'
import exportRouter from './routes/export.js'
import analyticsRouter from './routes/analytics.js'
import settingsRouter from './routes/settings.js'
import authRouter from './routes/auth.js'
import { authenticate } from './middleware/auth.js'
import { auditMiddleware } from './middleware/audit.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const isProduction = process.env.NODE_ENV === 'production'

// ===========================================
// SECURITY MIDDLEWARE
// ===========================================

// Security headers (HIGH-4: Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // For Tailwind CSS
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: !isProduction, // Disable in dev for easier debugging
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))

// CORS configuration (HIGH-1: Restrict origins)
const corsOptions = {
  origin: isProduction
    ? process.env.FRONTEND_URL || 'https://your-domain.com'
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}
app.use(cors(corsOptions))

// Rate limiting (HIGH-2)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000, // Limit requests per window (more lenient in dev)
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health' // Don't rate limit health checks
})

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
})

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

// Request body parsing with size limits (MEDIUM-2)
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// Request logging middleware (development only for verbose logging)
if (!isProduction) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`)
    next()
  })
}

// ===========================================
// AUDIT LOGGING (CRITICAL-5: All requests logged)
// ===========================================
app.use('/api/', auditMiddleware)

// ===========================================
// API ROUTES
// ===========================================

// Auth routes (unauthenticated)
app.use('/api/auth', authRouter)

// Health check (unauthenticated)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Protected routes (require authentication) - CRITICAL-1
app.use('/api/clients', authenticate, clientsRouter)
app.use('/api/metrics', authenticate, metricsRouter)
app.use('/api/goals', authenticate, goalsRouter)
app.use('/api/bonuses', authenticate, bonusesRouter)
app.use('/api/dashboard', authenticate, dashboardRouter)
app.use('/api/export', authenticate, exportRouter)
app.use('/api/analytics', authenticate, analyticsRouter)
app.use('/api/settings', authenticate, settingsRouter)

// ===========================================
// ERROR HANDLING (HIGH-5: No info leakage)
// ===========================================
app.use((err, req, res, next) => {
  // Log full error server-side
  console.error('Error:', {
    message: err.message,
    stack: isProduction ? undefined : err.stack,
    user: req.user?.id,
    path: req.path,
    method: req.method
  })

  // Send sanitized error to client
  if (isProduction) {
    // Generic error message in production
    res.status(err.status || 500).json({
      error: 'An error occurred processing your request'
    })
  } else {
    // More details in development
    res.status(err.status || 500).json({
      error: err.message,
      path: req.path
    })
  }
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 API available at http://localhost:${PORT}/api`)
  console.log(`💾 Database: ${process.env.DATABASE_PATH || './data/crm.db'}\n`)
})
