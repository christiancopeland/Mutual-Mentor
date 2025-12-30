import express from 'express'
import { getDashboardSummary } from '../db/index.js'

const router = express.Router()

// GET /api/dashboard/summary - Get dashboard summary data
router.get('/summary', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const summary = getDashboardSummary(userId)
    res.json(summary)
  } catch (error) {
    console.error('Error fetching dashboard summary:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard summary' })
  }
})

export default router
