import express from 'express'
import db from '../db/index.js'

const router = express.Router()

// Pipeline analytics - client distribution by status and phase
router.get('/pipeline', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user

    // Get clients by status
    const statusQuery = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM clients
      WHERE user_id = ?
      GROUP BY status
    `)
    const byStatus = statusQuery.all(userId)

    // Get clients by phase (based on current_step)
    const phaseQuery = db.prepare(`
      SELECT
        CASE
          WHEN current_step <= 7 THEN 'Initial Contact'
          WHEN current_step <= 16 THEN 'Discovery'
          WHEN current_step <= 22 THEN 'Planning Prep'
          WHEN current_step <= 30 THEN 'Planning'
          WHEN current_step <= 35 THEN 'Closing'
          WHEN current_step <= 42 THEN 'Application'
          ELSE 'Follow-up'
        END as phase,
        COUNT(*) as count
      FROM clients
      WHERE user_id = ? AND status = 'active'
      GROUP BY phase
      ORDER BY
        CASE phase
          WHEN 'Initial Contact' THEN 1
          WHEN 'Discovery' THEN 2
          WHEN 'Planning Prep' THEN 3
          WHEN 'Planning' THEN 4
          WHEN 'Closing' THEN 5
          WHEN 'Application' THEN 6
          WHEN 'Follow-up' THEN 7
        END
    `)
    const byPhase = phaseQuery.all(userId)

    // Get average completion progress
    const progressQuery = db.prepare(`
      SELECT
        AVG(json_array_length(completed_steps)) as avg_steps,
        COUNT(*) as total_clients
      FROM clients
      WHERE user_id = ?
    `)
    const progressStats = progressQuery.get(userId)

    // Get recently completed clients (last 30 days)
    const completedQuery = db.prepare(`
      SELECT COUNT(*) as count
      FROM clients
      WHERE user_id = ?
        AND status = 'completed'
        AND updated_at >= datetime('now', '-30 days')
    `)
    const recentlyCompleted = completedQuery.get(userId)

    // Get stalled clients (no update in 14 days)
    const stalledQuery = db.prepare(`
      SELECT COUNT(*) as count
      FROM clients
      WHERE user_id = ?
        AND status = 'active'
        AND (last_contact_date IS NULL OR last_contact_date < datetime('now', '-14 days'))
    `)
    const potentiallyStalled = stalledQuery.get(userId)

    res.json({
      byStatus: byStatus.reduce((acc, row) => {
        acc[row.status] = row.count
        return acc
      }, {}),
      byPhase,
      averageProgress: progressStats.total_clients > 0
        ? Math.round((progressStats.avg_steps / 43) * 100)
        : 0,
      totalClients: progressStats.total_clients,
      recentlyCompleted: recentlyCompleted?.count || 0,
      potentiallyStalled: potentiallyStalled?.count || 0
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pipeline analytics' })
  }
})

// Performance trends - metrics over time
router.get('/performance', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const { period = 'weekly', limit = 12 } = req.query

    // Validate period
    const validPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ error: `Invalid period. Must be one of: ${validPeriods.join(', ')}` })
    }

    // Validate limit
    const limitNum = parseInt(limit)
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'limit must be a number between 1 and 100' })
    }

    // Get historical metrics for the period type
    const metricsQuery = db.prepare(`
      SELECT
        period_start,
        period_end,
        dials as contacts,
        meetings_set as appointments,
        kept_meetings as kept_appointments,
        closes,
        lives,
        points,
        CASE
          WHEN kept_meetings > 0 THEN ROUND((closes * 100.0) / kept_meetings)
          ELSE 0
        END as gut_ratio
      FROM granum_metrics
      WHERE user_id = ? AND period_type = ?
      ORDER BY period_start DESC
      LIMIT ?
    `)
    const metrics = metricsQuery.all(userId, period, limitNum)

    // Reverse to get chronological order and add period labels
    metrics.reverse()

    // Format period labels based on type
    const formatLabel = (dateStr, periodType) => {
      const date = new Date(dateStr)
      if (periodType === 'weekly') {
        return `Week ${Math.ceil(date.getDate() / 7)} ${date.toLocaleString('default', { month: 'short' })}`
      } else if (periodType === 'monthly') {
        return date.toLocaleString('default', { month: 'short', year: '2-digit' })
      }
      return dateStr
    }

    const trends = metrics.map(m => ({
      ...m,
      period_label: formatLabel(m.period_start, period)
    }))

    // Get goals for comparison
    const goalsQuery = db.prepare(`
      SELECT dials, meetings_set as appointments, kept_meetings as kept_appointments, closes, lives, points
      FROM goals
      WHERE user_id = ? AND period_type = ?
    `)
    const goals = goalsQuery.get(userId, period)

    res.json({
      period,
      trends,
      goals: goals || {
        dials: 0,
        appointments: 0,
        kept_appointments: 0,
        closes: 0,
        lives: 0,
        points: 0
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance analytics' })
  }
})

// Summary stats for quick overview
router.get('/summary', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user

    // Get this month's metrics vs goal
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    const monthlyMetrics = db.prepare(`
      SELECT dials, meetings_set as appointments, kept_meetings as kept_appointments, closes, lives, points
      FROM granum_metrics
      WHERE user_id = ? AND period_type = 'monthly' AND period_start = ?
    `).get(userId, monthStart)

    const monthlyGoals = db.prepare(`
      SELECT dials, meetings_set as appointments, kept_meetings as kept_appointments, closes, lives, points
      FROM goals
      WHERE user_id = ? AND period_type = 'monthly'
    `).get(userId)

    // Calculate progress percentages
    const calculateProgress = (actual, goal) => {
      if (!goal || goal === 0) return 0
      return Math.round((actual / goal) * 100)
    }

    const metrics = monthlyMetrics || { dials: 0, appointments: 0, kept_appointments: 0, closes: 0, lives: 0, points: 0 }
    const goals = monthlyGoals || { dials: 0, appointments: 0, kept_appointments: 0, closes: 0, lives: 0, points: 0 }

    res.json({
      monthly: {
        metrics,
        goals,
        progress: {
          dials: calculateProgress(metrics.dials, goals.dials),
          appointments: calculateProgress(metrics.appointments, goals.appointments),
          kept_appointments: calculateProgress(metrics.kept_appointments, goals.kept_appointments),
          closes: calculateProgress(metrics.closes, goals.closes),
          lives: calculateProgress(metrics.lives, goals.lives),
          points: calculateProgress(metrics.points, goals.points)
        }
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics summary' })
  }
})

export default router
