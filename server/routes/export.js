import express from 'express'
import { getAllClients } from '../db/index.js'
import db from '../db/index.js'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const router = express.Router()

// Helper function to escape CSV values
function escapeCSV(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// Helper to get phase name from step number
function getPhaseName(stepNumber) {
  if (stepNumber <= 7) return 'Initial Contact'
  if (stepNumber <= 16) return 'Discovery'
  if (stepNumber <= 22) return 'Planning Prep'
  if (stepNumber <= 30) return 'Planning'
  if (stepNumber <= 35) return 'Closing'
  if (stepNumber <= 42) return 'Application'
  return 'Follow-up'
}

// Export clients to CSV
router.get('/clients/csv', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const clients = getAllClients(userId, {})

    // CSV headers
    const headers = [
      'Name',
      'Phone',
      'Email',
      'Status',
      'Current Step',
      'Current Phase',
      'Progress (%)',
      'Completed Steps',
      'JW Partner',
      'Referral Source',
      'Date Added',
      'Last Contact Date',
      'Notes'
    ]

    // Create CSV rows
    const rows = clients.map(client => {
      const completedSteps = Array.isArray(client.completed_steps)
        ? client.completed_steps
        : JSON.parse(client.completed_steps || '[]')
      const progress = Math.round((completedSteps.length / 43) * 100)

      return [
        escapeCSV(`${client.first_name} ${client.last_name}`),
        escapeCSV(client.phone),
        escapeCSV(client.email),
        escapeCSV(client.status),
        client.current_step,
        escapeCSV(getPhaseName(client.current_step)),
        progress,
        completedSteps.length,
        escapeCSV(client.jw_partner),
        escapeCSV(client.referral_source),
        escapeCSV(client.date_added),
        escapeCSV(client.last_contact_date),
        escapeCSV(client.notes)
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')

    // Set response headers for CSV download
    const filename = `mutual-mentor-clients-${new Date().toISOString().split('T')[0]}.csv`
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Export metrics to CSV
router.get('/metrics/csv', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const { period_type } = req.query

    // Build query
    let query = `
      SELECT * FROM granum_metrics
      WHERE user_id = ?
    `
    const params = [userId]

    if (period_type) {
      query += ` AND period_type = ?`
      params.push(period_type)
    }

    query += ` ORDER BY period_start DESC`

    const metrics = db.prepare(query).all(...params)

    // CSV headers
    const headers = [
      'Period Type',
      'Period Start',
      'Period End',
      'Dials',
      'Appointments',
      'Kept Appointments',
      'Closes',
      'Lives',
      'Points',
      'GUT Ratio (%)',
      'Created At'
    ]

    // Create CSV rows
    const rows = metrics.map(metric => {
      const gutRatio = metric.kept_appointments > 0
        ? Math.round((metric.closes / metric.kept_appointments) * 100)
        : 0

      return [
        escapeCSV(metric.period_type),
        escapeCSV(metric.period_start),
        escapeCSV(metric.period_end),
        metric.dials,
        metric.appointments,
        metric.kept_appointments,
        metric.closes,
        metric.lives,
        metric.points,
        gutRatio,
        escapeCSV(metric.created_at)
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')

    // Set response headers for CSV download
    const periodSuffix = period_type ? `-${period_type}` : ''
    const filename = `mutual-mentor-metrics${periodSuffix}-${new Date().toISOString().split('T')[0]}.csv`
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Export goals to CSV
router.get('/goals/csv', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const goals = db.prepare(`
      SELECT * FROM goals
      WHERE user_id = ?
      ORDER BY
        CASE period_type
          WHEN 'daily' THEN 1
          WHEN 'weekly' THEN 2
          WHEN 'monthly' THEN 3
          WHEN 'quarterly' THEN 4
          WHEN 'yearly' THEN 5
        END
    `).all(userId)

    // CSV headers
    const headers = [
      'Period Type',
      'Dials Goal',
      'Appointments Goal',
      'Kept Appointments Goal',
      'Closes Goal',
      'Lives Goal',
      'Points Goal'
    ]

    // Create CSV rows
    const rows = goals.map(goal => [
      escapeCSV(goal.period_type),
      goal.dials,
      goal.appointments,
      goal.kept_appointments,
      goal.closes,
      goal.lives,
      goal.points
    ].join(','))

    const csv = [headers.join(','), ...rows].join('\n')

    const filename = `mutual-mentor-goals-${new Date().toISOString().split('T')[0]}.csv`
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Export bonuses to CSV
router.get('/bonuses/csv', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const bonuses = db.prepare(`
      SELECT * FROM bonuses
      WHERE user_id = ?
      ORDER BY deadline ASC
    `).all(userId)

    // CSV headers
    const headers = [
      'Name',
      'Description',
      'Metric Type',
      'Target Value',
      'Current Value',
      'Progress (%)',
      'Start Date',
      'Deadline',
      'Status',
      'Created At'
    ]

    // Create CSV rows
    const rows = bonuses.map(bonus => {
      const progress = bonus.target_value > 0
        ? Math.round((bonus.current_value / bonus.target_value) * 100)
        : 0

      return [
        escapeCSV(bonus.name),
        escapeCSV(bonus.description),
        escapeCSV(bonus.metric_type),
        bonus.target_value,
        bonus.current_value,
        progress,
        escapeCSV(bonus.start_date),
        escapeCSV(bonus.deadline),
        escapeCSV(bonus.status),
        escapeCSV(bonus.created_at)
      ].join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')

    const filename = `mutual-mentor-bonuses-${new Date().toISOString().split('T')[0]}.csv`
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// SECURITY: Database backup endpoint REMOVED
// This endpoint was a critical security vulnerability (CRITICAL-3)
// that allowed unauthenticated access to the entire database.
// Backups should only be performed by authorized administrators
// through secure, authenticated channels.

export default router
