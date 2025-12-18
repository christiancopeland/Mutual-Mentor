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

// GET /api/metrics - Get metrics for a specific period (with real-time aggregation)
router.get('/', (req, res) => {
  try {
    const { period_type = 'daily', date, use_aggregated = 'true' } = req.query
    const targetDate = date ? new Date(date) : new Date()

    // Use aggregated metrics by default for accuracy
    const useAggregated = use_aggregated !== 'false'

    let metrics
    if (useAggregated) {
      // Real-time aggregation from metric_entries
      metrics = getAggregatedMetrics(period_type, targetDate)
    } else {
      // Use stored metrics (legacy)
      metrics = getMetrics(period_type, targetDate)
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
    res.status(500).json({ error: error.message })
  }
})

// GET /api/metrics/summary - Get metrics summary across all timeframes
router.get('/summary', (req, res) => {
  try {
    const { date } = req.query
    const targetDate = date ? new Date(date) : new Date()

    const summary = getMetricsSummary(targetDate)
    res.json(summary)
  } catch (error) {
    console.error('Error fetching metrics summary:', error)
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/metrics - Update/upsert metrics for a period
router.put('/', (req, res) => {
  try {
    const { period_type, date, ...data } = req.body

    if (!period_type) {
      return res.status(400).json({ error: 'period_type is required' })
    }

    const validTypes = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    if (!validTypes.includes(period_type)) {
      return res.status(400).json({ error: `Invalid period_type. Must be one of: ${validTypes.join(', ')}` })
    }

    const targetDate = date ? new Date(date) : new Date()
    const metrics = upsertMetrics(period_type, data, targetDate)

    res.json(metrics)
  } catch (error) {
    console.error('Error updating metrics:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/metrics/entry - Log a single metric entry
router.post('/entry', (req, res) => {
  try {
    const { metric_type, value = 1, date, notes = '' } = req.body

    if (!metric_type) {
      return res.status(400).json({ error: 'metric_type is required' })
    }

    const validTypes = [
      'days_worked', 'meetings_made', 'kept_meetings', 'dials', 'reached',
      'meetings_set', 'meals', 'qs_obtained', 'qs_asked', 'new_seen',
      'new_fact_finder', 'case_opened', 'joint_work', 'plans', 'closes',
      'points', 'lives', 'clients', 'premium', 'meetings_ahead'
    ]
    if (!validTypes.includes(metric_type)) {
      return res.status(400).json({ error: `Invalid metric_type. Must be one of: ${validTypes.join(', ')}` })
    }

    const targetDate = date ? new Date(date) : new Date()
    const entry = logMetricEntry(metric_type, value, targetDate, notes)

    res.status(201).json(entry)
  } catch (error) {
    console.error('Error logging metric entry:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /api/metrics/recalculate - Recalculate all period metrics from entries
router.post('/recalculate', (req, res) => {
  try {
    const { date } = req.body
    const targetDate = date ? new Date(date) : new Date()

    const results = recalculateAllPeriodMetrics(targetDate)

    res.json({
      message: 'Successfully recalculated all period metrics',
      metrics: results
    })
  } catch (error) {
    console.error('Error recalculating metrics:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/metrics/aggregated/:period_type - Get aggregated metrics for a specific period
router.get('/aggregated/:period_type', (req, res) => {
  try {
    const { period_type } = req.params
    const { date } = req.query

    const validTypes = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    if (!validTypes.includes(period_type)) {
      return res.status(400).json({ error: `Invalid period_type. Must be one of: ${validTypes.join(', ')}` })
    }

    const targetDate = date ? new Date(date) : new Date()
    const aggregated = aggregateMetricsFromEntries(period_type, targetDate)
    const boundaries = getPeriodBoundaries(targetDate, period_type)

    res.json({
      ...aggregated,
      period_type,
      period_start: boundaries.start,
      period_end: boundaries.end
    })
  } catch (error) {
    console.error('Error fetching aggregated metrics:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
