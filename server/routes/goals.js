import express from 'express'
import {
  getAllGoals,
  getGoalsByPeriod,
  updateGoals
} from '../db/index.js'

const router = express.Router()

const VALID_PERIOD_TYPES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']

// GET /api/goals - Get all goals
router.get('/', (req, res) => {
  try {
    const goals = getAllGoals()

    // Transform to object keyed by period_type for easier frontend consumption
    const goalsMap = {}
    goals.forEach(goal => {
      goalsMap[goal.period_type] = goal
    })

    res.json(goalsMap)
  } catch (error) {
    console.error('Error fetching goals:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/goals/:periodType - Get goals for a specific period
router.get('/:periodType', (req, res) => {
  try {
    const { periodType } = req.params

    if (!VALID_PERIOD_TYPES.includes(periodType)) {
      return res.status(400).json({ error: `Invalid period type. Must be one of: ${VALID_PERIOD_TYPES.join(', ')}` })
    }

    const goals = getGoalsByPeriod(periodType)

    if (!goals) {
      return res.status(404).json({ error: `Goals not found for period: ${periodType}` })
    }

    res.json(goals)
  } catch (error) {
    console.error('Error fetching goals:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/goals/:periodType - Update goals for a period
router.put('/:periodType', (req, res) => {
  try {
    const { periodType } = req.params

    if (!VALID_PERIOD_TYPES.includes(periodType)) {
      return res.status(400).json({ error: `Invalid period type. Must be one of: ${VALID_PERIOD_TYPES.join(', ')}` })
    }

    const goals = updateGoals(periodType, req.body)
    res.json(goals)
  } catch (error) {
    console.error('Error updating goals:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
