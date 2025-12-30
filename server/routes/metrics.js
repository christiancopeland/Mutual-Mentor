import express from 'express'
import {
  getMetrics,
  upsertMetrics,
  logMetricEntry,
  getMetricsSummary,
  getPeriodBoundaries,
  getAggregatedMetrics,
  recalculateAllPeriodMetrics,
  aggregateMetricsFromEntries
} from '../db/index.js'

const router = express.Router()

const VALID_PERIOD_TYPES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
const VALID_METRIC_TYPES = [
  'days_worked', 'meetings_made', 'kept_meetings', 'dials', 'reached',
  'meetings_set', 'meals', 'qs_obtained', 'qs_asked', 'new_seen',
  'new_fact_finder', 'case_opened', 'joint_work', 'plans', 'closes',
  'points', 'lives', 'clients', 'premium', 'meetings_ahead'
]

// GET /api/metrics - Get metrics for a specific period (with real-time aggregation)
router.get('/', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const { period_type = 'daily', date, use_aggregated = 'true' } = req.query
    const targetDate = date ? new Date(date) : new Date()

    // Validate period_type
    if (!VALID_PERIOD_TYPES.includes(period_type)) {
      return res.status(400).json({ error: `Invalid period_type. Must be one of: ${VALID_PERIOD_TYPES.join(', ')}` })
    }

    // Use aggregated metrics by default for accuracy
    const useAggregated = use_aggregated !== 'false'

    let metrics
    if (useAggregated) {
      // Real-time aggregation from metric_entries
      metrics = getAggregatedMetrics(period_type, targetDate, userId)
    } else {
      // Use stored metrics (legacy)
      metrics = getMetrics(period_type, targetDate, userId)
      const boundaries = getPeriodBoundaries(targetDate, period_type)
      metrics = {
        ...metrics,
        period_start: boundaries.start,
        period_end: boundaries.end
      }
    }

    res.json(metrics)
  } catch (error) {
    console.error('Error fetching metrics:', error)
    res.status(500).json({ error: 'Failed to fetch metrics' })
  }
})

// GET /api/metrics/summary - Get metrics summary across all timeframes
router.get('/summary', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const { date } = req.query
    const targetDate = date ? new Date(date) : new Date()

    const summary = getMetricsSummary(targetDate, userId)
    res.json(summary)
  } catch (error) {
    console.error('Error fetching metrics summary:', error)
    res.status(500).json({ error: 'Failed to fetch metrics summary' })
  }
})

// PUT /api/metrics - Update/upsert metrics for a period
router.put('/', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const { period_type, date, ...data } = req.body

    if (!period_type) {
      return res.status(400).json({ error: 'period_type is required' })
    }

    if (!VALID_PERIOD_TYPES.includes(period_type)) {
      return res.status(400).json({ error: `Invalid period_type. Must be one of: ${VALID_PERIOD_TYPES.join(', ')}` })
    }

    const targetDate = date ? new Date(date) : new Date()
    const metrics = upsertMetrics(period_type, data, targetDate, userId)

    res.json(metrics)
  } catch (error) {
    console.error('Error updating metrics:', error)
    res.status(500).json({ error: 'Failed to update metrics' })
  }
})

// POST /api/metrics/entry - Log a single metric entry
router.post('/entry', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const { metric_type, value = 1, date, notes = '' } = req.body

    if (!metric_type) {
      return res.status(400).json({ error: 'metric_type is required' })
    }

    if (!VALID_METRIC_TYPES.includes(metric_type)) {
      return res.status(400).json({ error: `Invalid metric_type. Must be one of: ${VALID_METRIC_TYPES.join(', ')}` })
    }

    // Validate value
    if (typeof value !== 'number' || isNaN(value)) {
      return res.status(400).json({ error: 'value must be a number' })
    }

    // Validate notes length
    if (notes && notes.length > 1000) {
      return res.status(400).json({ error: 'notes too long (max 1000 characters)' })
    }

    const targetDate = date ? new Date(date) : new Date()
    const entry = logMetricEntry(metric_type, value, targetDate, notes, userId)

    res.status(201).json(entry)
  } catch (error) {
    console.error('Error logging metric entry:', error)
    res.status(500).json({ error: 'Failed to log metric entry' })
  }
})

// POST /api/metrics/recalculate - Recalculate all period metrics from entries
router.post('/recalculate', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const { date } = req.body
    const targetDate = date ? new Date(date) : new Date()

    const results = recalculateAllPeriodMetrics(targetDate, userId)

    res.json({
      message: 'Successfully recalculated all period metrics',
      metrics: results
    })
  } catch (error) {
    console.error('Error recalculating metrics:', error)
    res.status(500).json({ error: 'Failed to recalculate metrics' })
  }
})

// GET /api/metrics/aggregated/:period_type - Get aggregated metrics for a specific period
router.get('/aggregated/:period_type', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const { period_type } = req.params
    const { date } = req.query

    if (!VALID_PERIOD_TYPES.includes(period_type)) {
      return res.status(400).json({ error: `Invalid period_type. Must be one of: ${VALID_PERIOD_TYPES.join(', ')}` })
    }

    const targetDate = date ? new Date(date) : new Date()
    const aggregated = aggregateMetricsFromEntries(period_type, targetDate, userId)
    const boundaries = getPeriodBoundaries(targetDate, period_type)

    res.json({
      ...aggregated,
      period_type,
      period_start: boundaries.start,
      period_end: boundaries.end
    })
  } catch (error) {
    console.error('Error fetching aggregated metrics:', error)
    res.status(500).json({ error: 'Failed to fetch aggregated metrics' })
  }
})

export default router
