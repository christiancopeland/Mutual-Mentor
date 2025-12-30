import express from 'express'
import { getSettings, updateSettings, getFiscalQuarter } from '../db/index.js'

const router = express.Router()

// GET /api/settings - Get user settings
router.get('/', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const settings = getSettings(userId)
    res.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

// PUT /api/settings - Update user settings
router.put('/', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const {
      fiscal_q1_start,
      fiscal_q2_start,
      fiscal_q3_start,
      fiscal_q4_start,
      timezone,
      date_format,
      week_starts_on
    } = req.body

    // Validate fiscal quarter dates (MM-DD format)
    const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/
    if (fiscal_q1_start && !dateRegex.test(fiscal_q1_start)) {
      return res.status(400).json({ error: 'fiscal_q1_start must be in MM-DD format' })
    }
    if (fiscal_q2_start && !dateRegex.test(fiscal_q2_start)) {
      return res.status(400).json({ error: 'fiscal_q2_start must be in MM-DD format' })
    }
    if (fiscal_q3_start && !dateRegex.test(fiscal_q3_start)) {
      return res.status(400).json({ error: 'fiscal_q3_start must be in MM-DD format' })
    }
    if (fiscal_q4_start && !dateRegex.test(fiscal_q4_start)) {
      return res.status(400).json({ error: 'fiscal_q4_start must be in MM-DD format' })
    }

    // Validate week_starts_on
    if (week_starts_on && !['sunday', 'monday'].includes(week_starts_on)) {
      return res.status(400).json({ error: 'week_starts_on must be "sunday" or "monday"' })
    }

    // Validate timezone format (basic check)
    if (timezone && typeof timezone !== 'string') {
      return res.status(400).json({ error: 'Invalid timezone format' })
    }

    // Validate date_format
    const validDateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']
    if (date_format && !validDateFormats.includes(date_format)) {
      return res.status(400).json({ error: `date_format must be one of: ${validDateFormats.join(', ')}` })
    }

    const settings = updateSettings(req.body, userId)
    res.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

// GET /api/settings/fiscal-quarter - Get fiscal quarter for a date
router.get('/fiscal-quarter', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const { date } = req.query
    const targetDate = date ? new Date(date) : new Date()

    // Validate date
    if (date && isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' })
    }

    const quarterInfo = getFiscalQuarter(targetDate, userId)
    res.json(quarterInfo)
  } catch (error) {
    console.error('Error getting fiscal quarter:', error)
    res.status(500).json({ error: 'Failed to get fiscal quarter' })
  }
})

export default router
