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

// GET /api/bonuses - List all bonuses
router.get('/', (req, res) => {
  try {
    const { status } = req.query
    const filters = {}

    if (status) filters.status = status

    const bonuses = getAllBonuses('default', filters)

    // Calculate days remaining and progress percentage for each bonus
    const today = new Date()
    const bonusesWithCalculations = bonuses.map(bonus => {
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
    })

    res.json(bonusesWithCalculations)
  } catch (error) {
    console.error('Error fetching bonuses:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/bonuses/:id - Get a specific bonus
router.get('/:id', (req, res) => {
  try {
    const bonus = getBonusById(req.params.id)

    if (!bonus) {
      return res.status(404).json({ error: 'Bonus not found' })
    }

    // Calculate days remaining and progress
    const today = new Date()
    const deadline = new Date(bonus.deadline)
    const diffTime = deadline - today
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const progressPercentage = bonus.target_value > 0
      ? Math.round((bonus.current_value / bonus.target_value) * 100)
      : 0

    res.json({
      ...bonus,
      days_remaining: daysRemaining,
      progress_percentage: progressPercentage
    })
  } catch (error) {
    console.error('Error fetching bonus:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/bonuses - Create a new bonus
router.post('/', (req, res) => {
  try {
    const { name, metric_type, target_value, start_date, deadline } = req.body

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Bonus name is required' })
    }
    if (!metric_type) {
      return res.status(400).json({ error: 'metric_type is required' })
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

    const bonus = createBonus(req.body)

    // Calculate days remaining and progress
    const today = new Date()
    const deadlineDate = new Date(bonus.deadline)
    const diffTime = deadlineDate - today
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const progressPercentage = bonus.target_value > 0
      ? Math.round((bonus.current_value / bonus.target_value) * 100)
      : 0

    res.status(201).json({
      ...bonus,
      days_remaining: daysRemaining,
      progress_percentage: progressPercentage
    })
  } catch (error) {
    console.error('Error creating bonus:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/bonuses/:id - Update a bonus
router.put('/:id', (req, res) => {
  try {
    const bonus = updateBonus(req.params.id, req.body)

    if (!bonus) {
      return res.status(404).json({ error: 'Bonus not found' })
    }

    // Calculate days remaining and progress
    const today = new Date()
    const deadline = new Date(bonus.deadline)
    const diffTime = deadline - today
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const progressPercentage = bonus.target_value > 0
      ? Math.round((bonus.current_value / bonus.target_value) * 100)
      : 0

    res.json({
      ...bonus,
      days_remaining: daysRemaining,
      progress_percentage: progressPercentage
    })
  } catch (error) {
    console.error('Error updating bonus:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/bonuses/:id/progress - Update bonus progress
router.put('/:id/progress', (req, res) => {
  try {
    const { current_value } = req.body

    if (current_value === undefined || current_value < 0) {
      return res.status(400).json({ error: 'current_value must be a non-negative number' })
    }

    const bonus = updateBonusProgress(req.params.id, current_value)

    if (!bonus) {
      return res.status(404).json({ error: 'Bonus not found' })
    }

    // Calculate days remaining and progress
    const today = new Date()
    const deadline = new Date(bonus.deadline)
    const diffTime = deadline - today
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const progressPercentage = bonus.target_value > 0
      ? Math.round((bonus.current_value / bonus.target_value) * 100)
      : 0

    res.json({
      ...bonus,
      days_remaining: daysRemaining,
      progress_percentage: progressPercentage
    })
  } catch (error) {
    console.error('Error updating bonus progress:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/bonuses/:id - Archive/delete a bonus
router.delete('/:id', (req, res) => {
  try {
    const success = deleteBonus(req.params.id)

    if (!success) {
      return res.status(404).json({ error: 'Bonus not found' })
    }

    res.json({ message: 'Bonus archived successfully' })
  } catch (error) {
    console.error('Error deleting bonus:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
