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
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const goals = getAllGoals(userId)

    // Transform to object keyed by period_type for easier frontend consumption
    const goalsMap = {}
    goals.forEach(goal => {
      goalsMap[goal.period_type] = goal
    })

    res.json(goalsMap)
  } catch (error) {
    console.error('Error fetching goals:', error)
    res.status(500).json({ error: 'Failed to fetch goals' })
  }
})

// GET /api/goals/:periodType - Get goals for a specific period
router.get('/:periodType', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const { periodType } = req.params

    if (!VALID_PERIOD_TYPES.includes(periodType)) {
      return res.status(400).json({ error: `Invalid period type. Must be one of: ${VALID_PERIOD_TYPES.join(', ')}` })
    }

    const goals = getGoalsByPeriod(periodType, userId)

    if (!goals) {
      return res.status(404).json({ error: `Goals not found for period: ${periodType}` })
    }

    res.json(goals)
  } catch (error) {
    console.error('Error fetching goals:', error)
    res.status(500).json({ error: 'Failed to fetch goals' })
  }
})

// PUT /api/goals/:periodType - Update goals for a period
router.put('/:periodType', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const { periodType } = req.params

    if (!VALID_PERIOD_TYPES.includes(periodType)) {
      return res.status(400).json({ error: `Invalid period type. Must be one of: ${VALID_PERIOD_TYPES.join(', ')}` })
    }

    // Validate that all goal values are non-negative numbers
    const goalFields = [
      'days_worked', 'meetings_made', 'kept_meetings', 'dials', 'reached',
      'meetings_set', 'meals', 'qs_obtained', 'qs_asked', 'new_seen',
      'new_fact_finder', 'case_opened', 'joint_work', 'plans', 'closes',
      'points', 'lives', 'clients', 'premium', 'meetings_ahead'
    ]

    for (const field of goalFields) {
      if (req.body[field] !== undefined) {
        const value = Number(req.body[field])
        if (isNaN(value) || value < 0) {
          return res.status(400).json({ error: `${field} must be a non-negative number` })
        }
      }
    }

    const goals = updateGoals(periodType, req.body, userId)
    res.json(goals)
  } catch (error) {
    console.error('Error updating goals:', error)
    res.status(500).json({ error: 'Failed to update goals' })
  }
})

export default router
