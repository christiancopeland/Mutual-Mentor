import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DB_PATH = process.env.DATABASE_PATH || join(__dirname, '../data/crm.db')

// Initialize database
const db = new Database(DB_PATH, { verbose: console.log })

// Enable foreign keys
db.pragma('foreign_keys = ON')

/**
 * Initialize database schema
 */
export function initializeDatabase() {
  console.log('Initializing database schema...')

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Clients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',

      -- Basic Info
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,

      -- Pipeline Tracking
      current_step INTEGER DEFAULT 1,
      completed_steps TEXT DEFAULT '[]',
      status TEXT DEFAULT 'active'
        CHECK (status IN ('active', 'stalled', 'completed', 'lost')),

      -- Relationship
      referral_source TEXT,
      jw_partner TEXT,
      notes TEXT,
      referral_contacts TEXT DEFAULT '[]',

      -- Timestamps
      date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_contact_date DATETIME,
      next_action_due DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `)

  // Pipeline steps table
  db.exec(`
    CREATE TABLE IF NOT EXISTS pipeline_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      step_number INTEGER NOT NULL,
      name TEXT NOT NULL,
      phase TEXT NOT NULL,
      is_default INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,

      UNIQUE(user_id, step_number)
    );
  `)

  // Granum metrics table - period-based metrics storage
  db.exec(`
    CREATE TABLE IF NOT EXISTS granum_metrics (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',

      -- Period identification
      period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,

      -- Core metrics (in Northwestern Mutual advisor order)
      days_worked INTEGER DEFAULT 0,
      meetings_made INTEGER DEFAULT 0,
      kept_meetings INTEGER DEFAULT 0,
      dials INTEGER DEFAULT 0,
      reached INTEGER DEFAULT 0,
      meetings_set INTEGER DEFAULT 0,
      meals INTEGER DEFAULT 0,
      qs_obtained INTEGER DEFAULT 0,
      qs_asked INTEGER DEFAULT 0,
      new_seen INTEGER DEFAULT 0,
      new_fact_finder INTEGER DEFAULT 0,
      case_opened INTEGER DEFAULT 0,
      joint_work INTEGER DEFAULT 0,
      plans INTEGER DEFAULT 0,
      closes INTEGER DEFAULT 0,
      points INTEGER DEFAULT 0,
      lives INTEGER DEFAULT 0,
      clients INTEGER DEFAULT 0,
      premium REAL DEFAULT 0.0,
      meetings_ahead INTEGER DEFAULT 0,

      -- Legacy fields (kept for backward compatibility, maps to new fields)
      -- appointments maps to meetings_set
      -- kept_appointments maps to kept_meetings

      -- Timestamps
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      UNIQUE(user_id, period_type, period_start)
    );
  `)

  // Goals table - goal targets per timeframe
  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',

      -- Period type
      period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),

      -- Goal values (matching granum_metrics schema)
      days_worked INTEGER DEFAULT 0,
      meetings_made INTEGER DEFAULT 0,
      kept_meetings INTEGER DEFAULT 0,
      dials INTEGER DEFAULT 0,
      reached INTEGER DEFAULT 0,
      meetings_set INTEGER DEFAULT 0,
      meals INTEGER DEFAULT 0,
      qs_obtained INTEGER DEFAULT 0,
      qs_asked INTEGER DEFAULT 0,
      new_seen INTEGER DEFAULT 0,
      new_fact_finder INTEGER DEFAULT 0,
      case_opened INTEGER DEFAULT 0,
      joint_work INTEGER DEFAULT 0,
      plans INTEGER DEFAULT 0,
      closes INTEGER DEFAULT 0,
      points INTEGER DEFAULT 0,
      lives INTEGER DEFAULT 0,
      clients INTEGER DEFAULT 0,
      premium REAL DEFAULT 0.0,
      meetings_ahead INTEGER DEFAULT 0,

      -- Timestamps
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      UNIQUE(user_id, period_type)
    );
  `)

  // Bonuses table - custom bonus challenges
  db.exec(`
    CREATE TABLE IF NOT EXISTS bonuses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',

      -- Bonus details
      name TEXT NOT NULL,
      description TEXT,
      metric_type TEXT NOT NULL CHECK (metric_type IN (
        'dials', 'meetings_set', 'kept_meetings', 'closes',
        'plans', 'lives', 'clients', 'premium', 'referrals',
        'fact_finders', 'meetings_ahead', 'points', 'custom'
      )),
      custom_metric_name TEXT,

      -- Targets
      target_value REAL NOT NULL,
      current_value REAL DEFAULT 0,

      -- Dates
      start_date DATE NOT NULL,
      deadline DATE NOT NULL,

      -- Status
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'archived')),

      -- Timestamps
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Metric entries table - individual entry audit trail
  db.exec(`
    CREATE TABLE IF NOT EXISTS metric_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',

      -- Entry details
      metric_type TEXT NOT NULL CHECK (metric_type IN (
        'days_worked', 'meetings_made', 'kept_meetings', 'dials', 'reached',
        'meetings_set', 'meals', 'qs_obtained', 'qs_asked', 'new_seen',
        'new_fact_finder', 'case_opened', 'joint_work', 'plans', 'closes',
        'points', 'lives', 'clients', 'premium', 'meetings_ahead'
      )),
      value REAL NOT NULL DEFAULT 1,
      entry_date DATE NOT NULL,
      notes TEXT,

      -- Timestamps
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Settings table - user preferences and configuration
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',

      -- Fiscal quarter configuration (Northwestern Mutual style)
      fiscal_q1_start TEXT DEFAULT '09-22',  -- MM-DD format
      fiscal_q2_start TEXT DEFAULT '12-22',  -- MM-DD format
      fiscal_q3_start TEXT DEFAULT '03-22',  -- MM-DD format
      fiscal_q4_start TEXT DEFAULT '06-22',  -- MM-DD format

      -- General settings
      timezone TEXT DEFAULT 'America/New_York',
      date_format TEXT DEFAULT 'MM/DD/YYYY',
      week_starts_on TEXT DEFAULT 'sunday' CHECK (week_starts_on IN ('sunday', 'monday')),

      -- Timestamps
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      UNIQUE(user_id)
    );
  `)

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_clients_user_status ON clients(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_clients_jw ON clients(user_id, jw_partner);
    CREATE INDEX IF NOT EXISTS idx_granum_metrics_user_period ON granum_metrics(user_id, period_type, period_start);
    CREATE INDEX IF NOT EXISTS idx_goals_user_period ON goals(user_id, period_type);
    CREATE INDEX IF NOT EXISTS idx_bonuses_user_status ON bonuses(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_metric_entries_user_date ON metric_entries(user_id, entry_date);
  `)

  console.log('Database schema initialized successfully!')
}

/**
 * Get all clients
 */
export function getAllClients(userId = 'default', filters = {}) {
  let query = 'SELECT * FROM clients WHERE user_id = ?'
  const params = [userId]

  // Phase-level filtering (Northwestern Mutual pipeline phases)
  if (filters.status && filters.status !== 'all') {
    switch (filters.status) {
      case 'initial_contact':
        query += ' AND current_step >= 1 AND current_step <= 7 AND status = "active"'
        break
      case 'discovery_meeting':
        query += ' AND current_step >= 8 AND current_step <= 16 AND status = "active"'
        break
      case 'planning_prep':
        query += ' AND current_step >= 17 AND current_step <= 22 AND status = "active"'
        break
      case 'planning_meeting':
        query += ' AND current_step >= 23 AND current_step <= 30 AND status = "active"'
        break
      case 'closing_meeting':
        query += ' AND current_step >= 31 AND current_step <= 35 AND status = "active"'
        break
      case 'application_process':
        query += ' AND current_step >= 36 AND current_step <= 43 AND status = "active"'
        break
      case 'completed':
        query += ' AND status = "completed"'
        break
      // Legacy status filters (for backwards compatibility)
      case 'active':
      case 'stalled':
      case 'lost':
        query += ' AND status = ?'
        params.push(filters.status)
        break
    }
  }

  if (filters.search) {
    query += ' AND (first_name LIKE ? OR last_name LIKE ? OR (first_name || " " || last_name) LIKE ?)'
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`)
  }

  // Default sort by last name alphabetically (A-Z)
  const sortBy = filters.sort || 'last_name_asc'
  switch (sortBy) {
    case 'last_name_asc':
      query += ' ORDER BY last_name ASC, first_name ASC'
      break
    case 'last_name_desc':
      query += ' ORDER BY last_name DESC, first_name DESC'
      break
    case 'date_added_desc':
      query += ' ORDER BY created_at DESC'
      break
    case 'date_added_asc':
      query += ' ORDER BY created_at ASC'
      break
    default:
      query += ' ORDER BY last_name ASC, first_name ASC'
  }

  const stmt = db.prepare(query)
  const clients = stmt.all(...params)

  // Parse JSON fields
  return clients.map(client => ({
    ...client,
    completed_steps: JSON.parse(client.completed_steps || '[]'),
    referral_contacts: JSON.parse(client.referral_contacts || '[]')
  }))
}

/**
 * Get client by ID
 */
export function getClientById(id, userId = 'default') {
  const stmt = db.prepare('SELECT * FROM clients WHERE id = ? AND user_id = ?')
  const client = stmt.get(id, userId)

  if (!client) return null

  return {
    ...client,
    completed_steps: JSON.parse(client.completed_steps || '[]'),
    referral_contacts: JSON.parse(client.referral_contacts || '[]')
  }
}

/**
 * Create new client
 */
export function createClient(data, userId = 'default') {
  const id = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const stmt = db.prepare(`
    INSERT INTO clients (
      id, user_id, first_name, last_name, phone, email, referral_source, jw_partner, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    id,
    userId,
    data.first_name,
    data.last_name,
    data.phone || null,
    data.email || null,
    data.referral_source || null,
    data.jw_partner || null,
    data.notes || null
  )

  return getClientById(id, userId)
}

/**
 * Update client
 */
export function updateClient(id, data, userId = 'default') {
  const updates = []
  const params = []

  const allowedFields = ['first_name', 'last_name', 'phone', 'email', 'referral_source', 'jw_partner', 'notes', 'status', 'current_step', 'completed_steps', 'referral_contacts', 'last_contact_date', 'next_action_due']

  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`)

      // Stringify arrays
      if (field === 'completed_steps' || field === 'referral_contacts') {
        params.push(JSON.stringify(data[field]))
      } else {
        params.push(data[field])
      }
    }
  })

  if (updates.length === 0) {
    return getClientById(id, userId)
  }

  updates.push('updated_at = CURRENT_TIMESTAMP')

  const stmt = db.prepare(`
    UPDATE clients
    SET ${updates.join(', ')}
    WHERE id = ? AND user_id = ?
  `)

  params.push(id, userId)
  stmt.run(...params)

  return getClientById(id, userId)
}

/**
 * Delete client
 */
export function deleteClient(id, userId = 'default') {
  const stmt = db.prepare('DELETE FROM clients WHERE id = ? AND user_id = ?')
  const result = stmt.run(id, userId)
  return result.changes > 0
}

/**
 * Toggle pipeline step
 */
export function togglePipelineStep(clientId, stepNumber, isCompleting, userId = 'default') {
  const client = getClientById(clientId, userId)
  if (!client) throw new Error('Client not found')

  let completedSteps = [...client.completed_steps]

  if (isCompleting) {
    if (!completedSteps.includes(stepNumber)) {
      completedSteps.push(stepNumber)
      completedSteps.sort((a, b) => a - b)
    }
  } else {
    completedSteps = completedSteps.filter(step => step !== stepNumber)
  }

  // Calculate current step
  const currentStep = completedSteps.length > 0
    ? Math.max(...completedSteps) + 1
    : 1

  // Auto-complete if all 43 steps are done
  const status = completedSteps.length === 43 ? 'completed' : client.status

  return updateClient(clientId, {
    completed_steps: completedSteps,
    current_step: Math.min(currentStep, 43),
    status,
    last_contact_date: new Date().toISOString()
  }, userId)
}

/**
 * Get all pipeline steps
 */
export function getPipelineSteps(userId = 'default') {
  const stmt = db.prepare('SELECT * FROM pipeline_steps WHERE user_id = ? AND is_active = 1 ORDER BY step_number')
  return stmt.all(userId)
}

/**
 * Get client statistics
 */
export function getClientStats(userId = 'default') {
  const stats = {}

  const statusQuery = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM clients
    WHERE user_id = ?
    GROUP BY status
  `)

  const statusResults = statusQuery.all(userId)
  statusResults.forEach(row => {
    stats[row.status] = row.count
  })

  const totalStepsQuery = db.prepare(`
    SELECT SUM(json_array_length(completed_steps)) as total
    FROM clients
    WHERE user_id = ?
  `)

  const totalSteps = totalStepsQuery.get(userId)
  stats.total_steps_completed = totalSteps?.total || 0

  return stats
}

// ============================================
// GRANUM METRICS FUNCTIONS
// ============================================

/**
 * Calculate period boundaries for a given date and period type
 */
export function getPeriodBoundaries(date = new Date(), periodType = 'daily') {
  const d = new Date(date)
  let start, end

  switch (periodType) {
    case 'daily':
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      end = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      break
    case 'weekly':
      // Week starts on Sunday
      const day = d.getDay()
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day)
      end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (6 - day))
      break
    case 'monthly':
      start = new Date(d.getFullYear(), d.getMonth(), 1)
      end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      break
    case 'quarterly':
      const quarter = Math.floor(d.getMonth() / 3)
      start = new Date(d.getFullYear(), quarter * 3, 1)
      end = new Date(d.getFullYear(), quarter * 3 + 3, 0)
      break
    case 'yearly':
      start = new Date(d.getFullYear(), 0, 1)
      end = new Date(d.getFullYear(), 11, 31)
      break
    default:
      throw new Error(`Invalid period type: ${periodType}`)
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  }
}

/**
 * Get metrics for a specific period
 */
export function getMetrics(periodType, date = new Date(), userId = 'default') {
  const { start, end } = getPeriodBoundaries(date, periodType)

  const stmt = db.prepare(`
    SELECT * FROM granum_metrics
    WHERE user_id = ? AND period_type = ? AND period_start = ?
  `)

  let metrics = stmt.get(userId, periodType, start)

  if (!metrics) {
    // Return default empty metrics
    metrics = {
      id: null,
      user_id: userId,
      period_type: periodType,
      period_start: start,
      period_end: end,
      days_worked: 0,
      meetings_made: 0,
      kept_meetings: 0,
      dials: 0,
      reached: 0,
      meetings_set: 0,
      meals: 0,
      qs_obtained: 0,
      qs_asked: 0,
      new_seen: 0,
      new_fact_finder: 0,
      case_opened: 0,
      joint_work: 0,
      plans: 0,
      closes: 0,
      points: 0,
      lives: 0,
      clients: 0,
      premium: 0.0,
      meetings_ahead: 0
    }
  }

  return metrics
}

/**
 * Upsert metrics for a specific period
 */
export function upsertMetrics(periodType, data, date = new Date(), userId = 'default') {
  const { start, end } = getPeriodBoundaries(date, periodType)
  const id = `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const stmt = db.prepare(`
    INSERT INTO granum_metrics (
      id, user_id, period_type, period_start, period_end,
      days_worked, meetings_made, kept_meetings, dials, reached,
      meetings_set, meals, qs_obtained, qs_asked, new_seen,
      new_fact_finder, case_opened, joint_work, plans, closes,
      points, lives, clients, premium, meetings_ahead
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, period_type, period_start)
    DO UPDATE SET
      days_worked = excluded.days_worked,
      meetings_made = excluded.meetings_made,
      kept_meetings = excluded.kept_meetings,
      dials = excluded.dials,
      reached = excluded.reached,
      meetings_set = excluded.meetings_set,
      meals = excluded.meals,
      qs_obtained = excluded.qs_obtained,
      qs_asked = excluded.qs_asked,
      new_seen = excluded.new_seen,
      new_fact_finder = excluded.new_fact_finder,
      case_opened = excluded.case_opened,
      joint_work = excluded.joint_work,
      plans = excluded.plans,
      closes = excluded.closes,
      points = excluded.points,
      lives = excluded.lives,
      clients = excluded.clients,
      premium = excluded.premium,
      meetings_ahead = excluded.meetings_ahead,
      updated_at = CURRENT_TIMESTAMP
  `)

  stmt.run(
    id,
    userId,
    periodType,
    start,
    end,
    data.days_worked || 0,
    data.meetings_made || 0,
    data.kept_meetings || 0,
    data.dials || 0,
    data.reached || 0,
    data.meetings_set || 0,
    data.meals || 0,
    data.qs_obtained || 0,
    data.qs_asked || 0,
    data.new_seen || 0,
    data.new_fact_finder || 0,
    data.case_opened || 0,
    data.joint_work || 0,
    data.plans || 0,
    data.closes || 0,
    data.points || 0,
    data.lives || 0,
    data.clients || 0,
    data.premium || 0.0,
    data.meetings_ahead || 0
  )

  return getMetrics(periodType, date, userId)
}

/**
 * Log a single metric entry and update period metrics
 */
export function logMetricEntry(metricType, value = 1, date = new Date(), notes = '', userId = 'default') {
  const entryDate = new Date(date).toISOString().split('T')[0]
  const id = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Insert entry
  const insertStmt = db.prepare(`
    INSERT INTO metric_entries (id, user_id, metric_type, value, entry_date, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  insertStmt.run(id, userId, metricType, value, entryDate, notes)

  // Update all period metrics
  const periodTypes = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']

  for (const periodType of periodTypes) {
    const currentMetrics = getMetrics(periodType, date, userId)
    const updatedValue = (currentMetrics[metricType] || 0) + value

    upsertMetrics(periodType, {
      ...currentMetrics,
      [metricType]: updatedValue
    }, date, userId)
  }

  return { id, metric_type: metricType, value, entry_date: entryDate }
}

/**
 * Aggregate metrics from daily entries for a specific period
 * This calculates totals by summing up all daily metric entries within the period
 */
export function aggregateMetricsFromEntries(periodType, date = new Date(), userId = 'default') {
  const { start, end } = getPeriodBoundaries(date, periodType)

  // Get all metric entries within this period
  const stmt = db.prepare(`
    SELECT metric_type, SUM(value) as total
    FROM metric_entries
    WHERE user_id = ? AND entry_date >= ? AND entry_date <= ?
    GROUP BY metric_type
  `)

  const entries = stmt.all(userId, start, end)

  // Build aggregated metrics object
  const aggregated = {
    days_worked: 0,
    meetings_made: 0,
    kept_meetings: 0,
    dials: 0,
    reached: 0,
    meetings_set: 0,
    meals: 0,
    qs_obtained: 0,
    qs_asked: 0,
    new_seen: 0,
    new_fact_finder: 0,
    case_opened: 0,
    joint_work: 0,
    plans: 0,
    closes: 0,
    points: 0,
    lives: 0,
    clients: 0,
    premium: 0.0,
    meetings_ahead: 0
  }

  // Populate with actual values from entries
  entries.forEach(entry => {
    if (aggregated.hasOwnProperty(entry.metric_type)) {
      aggregated[entry.metric_type] = entry.total
    }
  })

  return aggregated
}

/**
 * Recalculate all period metrics from daily entries
 * This ensures period totals are accurate based on logged entries
 */
export function recalculateAllPeriodMetrics(date = new Date(), userId = 'default') {
  const periodTypes = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
  const results = {}

  for (const periodType of periodTypes) {
    const aggregated = aggregateMetricsFromEntries(periodType, date, userId)
    upsertMetrics(periodType, aggregated, date, userId)
    results[periodType] = aggregated
  }

  return results
}

/**
 * Get metrics for a period with real-time aggregation from entries
 * This provides the most accurate totals based on logged entries
 */
export function getAggregatedMetrics(periodType, date = new Date(), userId = 'default') {
  const aggregated = aggregateMetricsFromEntries(periodType, date, userId)
  const { start, end } = getPeriodBoundaries(date, periodType)

  return {
    ...aggregated,
    period_type: periodType,
    period_start: start,
    period_end: end,
    user_id: userId
  }
}

/**
 * Get metrics summary across all timeframes
 */
export function getMetricsSummary(date = new Date(), userId = 'default') {
  const periodTypes = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
  const summary = {}

  for (const periodType of periodTypes) {
    summary[periodType] = getMetrics(periodType, date, userId)
  }

  return summary
}

// ============================================
// GOALS FUNCTIONS
// ============================================

/**
 * Get all goals
 */
export function getAllGoals(userId = 'default') {
  const stmt = db.prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY period_type')
  return stmt.all(userId)
}

/**
 * Get goals by period type
 */
export function getGoalsByPeriod(periodType, userId = 'default') {
  const stmt = db.prepare('SELECT * FROM goals WHERE user_id = ? AND period_type = ?')
  return stmt.get(userId, periodType)
}

/**
 * Update goals for a period (upsert)
 */
export function updateGoals(periodType, data, userId = 'default') {
  const id = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const stmt = db.prepare(`
    INSERT INTO goals (
      id, user_id, period_type,
      days_worked, meetings_made, kept_meetings, dials, reached,
      meetings_set, meals, qs_obtained, qs_asked, new_seen,
      new_fact_finder, case_opened, joint_work, plans, closes,
      points, lives, clients, premium, meetings_ahead
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, period_type)
    DO UPDATE SET
      days_worked = excluded.days_worked,
      meetings_made = excluded.meetings_made,
      kept_meetings = excluded.kept_meetings,
      dials = excluded.dials,
      reached = excluded.reached,
      meetings_set = excluded.meetings_set,
      meals = excluded.meals,
      qs_obtained = excluded.qs_obtained,
      qs_asked = excluded.qs_asked,
      new_seen = excluded.new_seen,
      new_fact_finder = excluded.new_fact_finder,
      case_opened = excluded.case_opened,
      joint_work = excluded.joint_work,
      plans = excluded.plans,
      closes = excluded.closes,
      points = excluded.points,
      lives = excluded.lives,
      clients = excluded.clients,
      premium = excluded.premium,
      meetings_ahead = excluded.meetings_ahead,
      updated_at = CURRENT_TIMESTAMP
  `)

  stmt.run(
    id,
    userId,
    periodType,
    data.days_worked || 0,
    data.meetings_made || 0,
    data.kept_meetings || 0,
    data.dials || 0,
    data.reached || 0,
    data.meetings_set || 0,
    data.meals || 0,
    data.qs_obtained || 0,
    data.qs_asked || 0,
    data.new_seen || 0,
    data.new_fact_finder || 0,
    data.case_opened || 0,
    data.joint_work || 0,
    data.plans || 0,
    data.closes || 0,
    data.points || 0,
    data.lives || 0,
    data.clients || 0,
    data.premium || 0.0,
    data.meetings_ahead || 0
  )

  return getGoalsByPeriod(periodType, userId)
}

// ============================================
// BONUSES FUNCTIONS
// ============================================

/**
 * Get all bonuses
 */
export function getAllBonuses(userId = 'default', filters = {}) {
  let query = 'SELECT * FROM bonuses WHERE user_id = ?'
  const params = [userId]

  if (filters.status && filters.status !== 'all') {
    query += ' AND status = ?'
    params.push(filters.status)
  }

  query += ' ORDER BY deadline ASC'

  const stmt = db.prepare(query)
  return stmt.all(...params)
}

/**
 * Get bonus by ID
 */
export function getBonusById(id, userId = 'default') {
  const stmt = db.prepare('SELECT * FROM bonuses WHERE id = ? AND user_id = ?')
  return stmt.get(id, userId)
}

/**
 * Create a new bonus
 */
export function createBonus(data, userId = 'default') {
  const id = `bonus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const stmt = db.prepare(`
    INSERT INTO bonuses (id, user_id, name, description, metric_type, custom_metric_name, target_value, current_value, start_date, deadline, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    id,
    userId,
    data.name,
    data.description || null,
    data.metric_type,
    data.custom_metric_name || null,
    data.target_value,
    data.current_value || 0,
    data.start_date,
    data.deadline,
    data.status || 'active'
  )

  return getBonusById(id, userId)
}

/**
 * Update a bonus
 */
export function updateBonus(id, data, userId = 'default') {
  const updates = []
  const params = []

  const allowedFields = ['name', 'description', 'metric_type', 'custom_metric_name', 'target_value', 'current_value', 'start_date', 'deadline', 'status']

  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`)
      params.push(data[field])
    }
  })

  if (updates.length === 0) {
    return getBonusById(id, userId)
  }

  updates.push('updated_at = CURRENT_TIMESTAMP')

  const stmt = db.prepare(`
    UPDATE bonuses
    SET ${updates.join(', ')}
    WHERE id = ? AND user_id = ?
  `)

  params.push(id, userId)
  stmt.run(...params)

  return getBonusById(id, userId)
}

/**
 * Delete/archive a bonus
 */
export function deleteBonus(id, userId = 'default') {
  // Archive instead of hard delete
  const stmt = db.prepare(`
    UPDATE bonuses SET status = 'archived', updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `)
  const result = stmt.run(id, userId)
  return result.changes > 0
}

/**
 * Update bonus progress
 */
export function updateBonusProgress(id, currentValue, userId = 'default') {
  const bonus = getBonusById(id, userId)
  if (!bonus) return null

  let status = bonus.status

  // Auto-complete if target reached
  if (currentValue >= bonus.target_value && status === 'active') {
    status = 'completed'
  }

  return updateBonus(id, { current_value: currentValue, status }, userId)
}

// ============================================
// DASHBOARD FUNCTIONS
// ============================================

/**
 * Get dashboard summary data
 */
export function getDashboardSummary(userId = 'default') {
  // Get total clients with JW split calculation
  const clientsQuery = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN jw_partner IS NOT NULL AND jw_partner != '' THEN 1 ELSE 0 END) as jw_count,
      SUM(CASE WHEN jw_partner IS NULL OR jw_partner = '' THEN 1 ELSE 0 END) as solo_count
    FROM clients
    WHERE user_id = ? AND status IN ('active', 'completed')
  `)
  const clientStats = clientsQuery.get(userId)

  // JW calculation: solo_clients + (jw_clients * 0.5)
  const effectiveClients = (clientStats?.solo_count || 0) + ((clientStats?.jw_count || 0) * 0.5)

  // Get monthly metrics for GUT ratio
  const monthlyMetrics = getMetrics('monthly', new Date(), userId)

  // GUT Ratio: (closes / kept_meetings) * 100
  const gutRatio = monthlyMetrics.kept_meetings > 0
    ? Math.round((monthlyMetrics.closes / monthlyMetrics.kept_meetings) * 100)
    : 0

  // Get active bonuses count
  const bonusQuery = db.prepare(`
    SELECT COUNT(*) as count FROM bonuses
    WHERE user_id = ? AND status = 'active'
  `)
  const bonusCount = bonusQuery.get(userId)

  return {
    totalClients: clientStats?.total || 0,
    effectiveClients: effectiveClients,
    jwClients: clientStats?.jw_count || 0,
    soloClients: clientStats?.solo_count || 0,
    gutRatio: gutRatio,
    points: monthlyMetrics.points,
    activeBonuses: bonusCount?.count || 0
  }
}

// ============================================
// SETTINGS FUNCTIONS
// ============================================

/**
 * Get user settings
 */
export function getSettings(userId = 'default') {
  const stmt = db.prepare('SELECT * FROM settings WHERE user_id = ?')
  let settings = stmt.get(userId)

  // If no settings exist, create default settings
  if (!settings) {
    const id = `settings_${userId}_${Date.now()}`
    const insertStmt = db.prepare(`
      INSERT INTO settings (id, user_id)
      VALUES (?, ?)
    `)
    insertStmt.run(id, userId)
    settings = stmt.get(userId)
  }

  return settings
}

/**
 * Update user settings
 */
export function updateSettings(data, userId = 'default') {
  const id = `settings_${userId}_${Date.now()}`

  const stmt = db.prepare(`
    INSERT INTO settings (
      id, user_id, fiscal_q1_start, fiscal_q2_start, fiscal_q3_start, fiscal_q4_start,
      timezone, date_format, week_starts_on
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id)
    DO UPDATE SET
      fiscal_q1_start = excluded.fiscal_q1_start,
      fiscal_q2_start = excluded.fiscal_q2_start,
      fiscal_q3_start = excluded.fiscal_q3_start,
      fiscal_q4_start = excluded.fiscal_q4_start,
      timezone = excluded.timezone,
      date_format = excluded.date_format,
      week_starts_on = excluded.week_starts_on,
      updated_at = CURRENT_TIMESTAMP
  `)

  stmt.run(
    id,
    userId,
    data.fiscal_q1_start || '09-22',
    data.fiscal_q2_start || '12-22',
    data.fiscal_q3_start || '03-22',
    data.fiscal_q4_start || '06-22',
    data.timezone || 'America/New_York',
    data.date_format || 'MM/DD/YYYY',
    data.week_starts_on || 'sunday'
  )

  return getSettings(userId)
}

/**
 * Get fiscal quarter for a given date based on user settings
 */
export function getFiscalQuarter(date = new Date(), userId = 'default') {
  const settings = getSettings(userId)
  const targetDate = new Date(date)
  const year = targetDate.getFullYear()

  // Parse quarter start dates (MM-DD format)
  const parseQuarterDate = (mmdd, year) => {
    const [month, day] = mmdd.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  // Get all quarter start dates for current and next year
  const q1Start = parseQuarterDate(settings.fiscal_q1_start, year)
  const q2Start = parseQuarterDate(settings.fiscal_q2_start, year)
  const q3Start = parseQuarterDate(settings.fiscal_q3_start, year)
  const q4Start = parseQuarterDate(settings.fiscal_q4_start, year)
  const nextQ1Start = parseQuarterDate(settings.fiscal_q1_start, year + 1)

  // Determine which quarter the date falls into
  let quarter, startDate, endDate

  if (targetDate >= q1Start && targetDate < q2Start) {
    quarter = 'Q1'
    startDate = q1Start
    endDate = new Date(q2Start.getTime() - 1)
  } else if (targetDate >= q2Start && targetDate < q3Start) {
    quarter = 'Q2'
    startDate = q2Start
    endDate = new Date(q3Start.getTime() - 1)
  } else if (targetDate >= q3Start && targetDate < q4Start) {
    quarter = 'Q3'
    startDate = q3Start
    endDate = new Date(q4Start.getTime() - 1)
  } else if (targetDate >= q4Start && targetDate < nextQ1Start) {
    quarter = 'Q4'
    startDate = q4Start
    endDate = new Date(nextQ1Start.getTime() - 1)
  } else {
    // Date is before Q1 of current year, must be in Q4 of previous year
    const prevQ4Start = parseQuarterDate(settings.fiscal_q4_start, year - 1)
    quarter = 'Q4'
    startDate = prevQ4Start
    endDate = new Date(q1Start.getTime() - 1)
  }

  return {
    quarter,
    fiscal_year: startDate.getFullYear(),
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0]
  }
}

export default db
