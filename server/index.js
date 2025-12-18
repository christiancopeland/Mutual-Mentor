import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initializeDatabase } from './db/index.js'
import clientsRouter from './routes/clients.js'
import metricsRouter from './routes/metrics.js'
import goalsRouter from './routes/goals.js'
import bonusesRouter from './routes/bonuses.js'
import dashboardRouter from './routes/dashboard.js'
import exportRouter from './routes/export.js'
import analyticsRouter from './routes/analytics.js'
import settingsRouter from './routes/settings.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Initialize database
initializeDatabase()

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

// API Routes
app.use('/api/clients', clientsRouter)
app.use('/api/metrics', metricsRouter)
app.use('/api/goals', goalsRouter)
app.use('/api/bonuses', bonusesRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/export', exportRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/settings', settingsRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  })
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
