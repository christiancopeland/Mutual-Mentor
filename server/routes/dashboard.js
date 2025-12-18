import express from 'express'
import { getDashboardSummary } from '../db/index.js'

const router = express.Router()

// GET /api/dashboard/summary - Get dashboard summary data
router.get('/summary', (req, res) => {
  try {
    const summary = getDashboardSummary()
    res.json(summary)
  } catch (error) {
    console.error('Error fetching dashboard summary:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
