import express from 'express'
import {
  getAllBonuses,
  getBonusById,
  createBonus,
  updateBonus,
  deleteBonus,
  updateBonusProgress
} from '../db/index.js'

const router = express.Router()

const VALID_METRIC_TYPES = [
  'dials', 'meetings_set', 'kept_meetings', 'closes',
  'plans', 'lives', 'clients', 'premium', 'referrals',
  'fact_finders', 'meetings_ahead', 'points', 'custom'
]

// Helper to add calculated fields to bonus
function enrichBonus(bonus) {
  const today = new Date()
  const deadline = new Date(bonus.deadline)
  const diffTime = deadline - today
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const progressPercentage = bonus.target_value > 0
    ? Math.round((bonus.current_value / bonus.target_value) * 100)
    : 0

  return {
    ...bonus,
    days_remaining: daysRemaining,
    progress_percentage: progressPercentage
  }
}

// GET /api/bonuses - List all bonuses
router.get('/', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const { status } = req.query
    const filters = {}

    if (status) filters.status = status

    const bonuses = getAllBonuses(userId, filters)
    const bonusesWithCalculations = bonuses.map(enrichBonus)

    res.json(bonusesWithCalculations)
  } catch (error) {
    console.error('Error fetching bonuses:', error)
    res.status(500).json({ error: 'Failed to fetch bonuses' })
  }
})

// GET /api/bonuses/:id - Get a specific bonus
router.get('/:id', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const bonus = getBonusById(req.params.id, userId)

    if (!bonus) {
      return res.status(404).json({ error: 'Bonus not found' })
    }

    res.json(enrichBonus(bonus))
  } catch (error) {
    console.error('Error fetching bonus:', error)
    res.status(500).json({ error: 'Failed to fetch bonus' })
  }
})

// POST /api/bonuses - Create a new bonus
router.post('/', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const { name, metric_type, target_value, start_date, deadline, description } = req.body

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Bonus name is required' })
    }
    if (name.length > 100) {
      return res.status(400).json({ error: 'Bonus name too long (max 100 characters)' })
    }
    if (!metric_type) {
      return res.status(400).json({ error: 'metric_type is required' })
    }
    if (!VALID_METRIC_TYPES.includes(metric_type)) {
      return res.status(400).json({ error: `Invalid metric_type. Must be one of: ${VALID_METRIC_TYPES.join(', ')}` })
    }
    if (!target_value || target_value <= 0) {
      return res.status(400).json({ error: 'target_value must be a positive number' })
    }
    if (!start_date) {
      return res.status(400).json({ error: 'start_date is required' })
    }
    if (!deadline) {
      return res.status(400).json({ error: 'deadline is required' })
    }
    if (description && description.length > 500) {
      return res.status(400).json({ error: 'Description too long (max 500 characters)' })
    }

    // Validate dates
    const startDateObj = new Date(start_date)
    const deadlineObj = new Date(deadline)
    if (isNaN(startDateObj.getTime()) || isNaN(deadlineObj.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' })
    }
    if (deadlineObj <= startDateObj) {
      return res.status(400).json({ error: 'Deadline must be after start date' })
    }

    const bonus = createBonus(req.body, userId)
    res.status(201).json(enrichBonus(bonus))
  } catch (error) {
    console.error('Error creating bonus:', error)
    res.status(500).json({ error: 'Failed to create bonus' })
  }
})

// PUT /api/bonuses/:id - Update a bonus
router.put('/:id', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user

    // Validate name length if provided
    if (req.body.name && req.body.name.length > 100) {
      return res.status(400).json({ error: 'Bonus name too long (max 100 characters)' })
    }
    if (req.body.description && req.body.description.length > 500) {
      return res.status(400).json({ error: 'Description too long (max 500 characters)' })
    }
    if (req.body.metric_type && !VALID_METRIC_TYPES.includes(req.body.metric_type)) {
      return res.status(400).json({ error: `Invalid metric_type. Must be one of: ${VALID_METRIC_TYPES.join(', ')}` })
    }

    const bonus = updateBonus(req.params.id, req.body, userId)

    if (!bonus) {
      return res.status(404).json({ error: 'Bonus not found' })
    }

    res.json(enrichBonus(bonus))
  } catch (error) {
    console.error('Error updating bonus:', error)
    res.status(500).json({ error: 'Failed to update bonus' })
  }
})

// PUT /api/bonuses/:id/progress - Update bonus progress
router.put('/:id/progress', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const { current_value } = req.body

    if (current_value === undefined || current_value < 0) {
      return res.status(400).json({ error: 'current_value must be a non-negative number' })
    }

    const bonus = updateBonusProgress(req.params.id, current_value, userId)

    if (!bonus) {
      return res.status(404).json({ error: 'Bonus not found' })
    }

    res.json(enrichBonus(bonus))
  } catch (error) {
    console.error('Error updating bonus progress:', error)
    res.status(500).json({ error: 'Failed to update bonus progress' })
  }
})

// DELETE /api/bonuses/:id - Archive/delete a bonus
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const success = deleteBonus(req.params.id, userId)

    if (!success) {
      return res.status(404).json({ error: 'Bonus not found' })
    }

    res.json({ message: 'Bonus archived successfully' })
  } catch (error) {
    console.error('Error deleting bonus:', error)
    res.status(500).json({ error: 'Failed to delete bonus' })
  }
})

export default router
