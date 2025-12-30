/**
 * Test Application Factory
 * Creates a fresh Express app instance for testing
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

// Initialize database schema BEFORE importing routes
import { initializeDatabase } from '../db/index.js'
initializeDatabase()

// Import routes
import authRouter from '../routes/auth.js'
import clientsRouter from '../routes/clients.js'
import metricsRouter from '../routes/metrics.js'
import goalsRouter from '../routes/goals.js'
import bonusesRouter from '../routes/bonuses.js'
import dashboardRouter from '../routes/dashboard.js'
import exportRouter from '../routes/export.js'
import analyticsRouter from '../routes/analytics.js'
import settingsRouter from '../routes/settings.js'

// Import middleware
import { authenticate } from '../middleware/auth.js'
import { auditMiddleware } from '../middleware/audit.js'

/**
 * Create a test application instance
 * @param {Object} options - Configuration options
 * @param {boolean} options.skipRateLimit - Skip rate limiting for tests
 * @returns {Express} Express application
 */
export function createTestApp(options = {}) {
  const app = express()
  const { skipRateLimit = true } = options

  // Security headers (simplified for testing)
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for testing
    crossOriginEmbedderPolicy: false
  }))

  // CORS (allow all for testing)
  app.use(cors())

  // Rate limiting (disabled by default for tests)
  if (!skipRateLimit) {
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: { error: 'Too many requests from this IP, please try again later.' }
    })
    app.use('/api/', apiLimiter)
  }

  // Body parsing
  app.use(express.json({ limit: '10kb' }))
  app.use(express.urlencoded({ extended: true, limit: '10kb' }))

  // Audit logging
  app.use('/api/', auditMiddleware)

  // Auth routes (unauthenticated)
  app.use('/api/auth', authRouter)

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Protected routes
  app.use('/api/clients', authenticate, clientsRouter)
  app.use('/api/metrics', authenticate, metricsRouter)
  app.use('/api/goals', authenticate, goalsRouter)
  app.use('/api/bonuses', authenticate, bonusesRouter)
  app.use('/api/dashboard', authenticate, dashboardRouter)
  app.use('/api/export', authenticate, exportRouter)
  app.use('/api/analytics', authenticate, analyticsRouter)
  app.use('/api/settings', authenticate, settingsRouter)

  // Error handling
  app.use((err, req, res, next) => {
    console.error('Test Error:', err.message)
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error'
    })
  })

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  return app
}

export default createTestApp
