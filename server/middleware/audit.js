import db from '../db/index.js'
import { v4 as uuidv4 } from 'uuid'

/**
 * Audit logging middleware
 * Logs all API requests with user identity, action, and result
 * CRITICAL for GLBA/SOC 2/FINRA compliance
 */

// Initialize audit_logs table
function initAuditTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_email TEXT,
      action TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      request_body TEXT,
      response_status INTEGER,
      response_time_ms INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
  `)
}

// Initialize on module load
try {
  initAuditTable()
} catch (err) {
  console.error('Failed to initialize audit_logs table:', err)
}

/**
 * Extract resource type and ID from request path
 */
function extractResource(path, method) {
  const parts = path.split('/').filter(Boolean)

  // Skip 'api' prefix
  if (parts[0] === 'api') {
    parts.shift()
  }

  const resourceType = parts[0] || null
  const resourceId = parts[1] || null

  return { resourceType, resourceId }
}

/**
 * Sanitize request body for logging
 * Removes sensitive fields and truncates large values
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return null

  const sanitized = { ...body }

  // Remove sensitive fields
  const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'api_key']
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  })

  // Truncate long strings
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string' && sanitized[key].length > 500) {
      sanitized[key] = sanitized[key].substring(0, 500) + '...[TRUNCATED]'
    }
  })

  try {
    return JSON.stringify(sanitized)
  } catch (err) {
    return '[UNABLE TO SERIALIZE]'
  }
}

/**
 * Get client IP address
 */
function getClientIP(req) {
  // Check various headers for proxy scenarios
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || req.connection?.remoteAddress || 'unknown'
}

/**
 * Log audit entry to database
 */
function logAudit(entry) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (
        id, user_id, user_email, action, method, path,
        resource_type, resource_id, ip_address, user_agent,
        request_body, response_status, response_time_ms, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      entry.id,
      entry.user_id,
      entry.user_email,
      entry.action,
      entry.method,
      entry.path,
      entry.resource_type,
      entry.resource_id,
      entry.ip_address,
      entry.user_agent,
      entry.request_body,
      entry.response_status,
      entry.response_time_ms,
      entry.timestamp
    )
  } catch (err) {
    // Log to console if database logging fails
    console.error('Failed to write audit log:', err)
    console.error('Audit entry:', JSON.stringify(entry))
  }
}

/**
 * Audit middleware - logs all requests
 */
export function auditMiddleware(req, res, next) {
  const startTime = Date.now()
  const { resourceType, resourceId } = extractResource(req.path, req.method)

  // Capture the original end function
  const originalEnd = res.end

  // Override end to capture response
  res.end = function (chunk, encoding) {
    res.end = originalEnd
    res.end(chunk, encoding)

    // Calculate response time
    const responseTime = Date.now() - startTime

    // Build action description
    const actionMap = {
      GET: 'VIEW',
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE'
    }
    const action = `${actionMap[req.method] || req.method}_${(resourceType || 'UNKNOWN').toUpperCase()}`

    // Create audit entry
    const auditEntry = {
      id: uuidv4(),
      user_id: req.user?.id || null,
      user_email: req.user?.email || null,
      action: action,
      method: req.method,
      path: req.path,
      resource_type: resourceType,
      resource_id: resourceId,
      ip_address: getClientIP(req),
      user_agent: req.headers['user-agent'] || null,
      request_body: ['POST', 'PUT', 'PATCH'].includes(req.method)
        ? sanitizeBody(req.body)
        : null,
      response_status: res.statusCode,
      response_time_ms: responseTime,
      timestamp: new Date().toISOString()
    }

    // Log asynchronously to not block response
    setImmediate(() => logAudit(auditEntry))
  }

  next()
}

/**
 * Get audit logs with filtering
 */
export function getAuditLogs(filters = {}) {
  let query = 'SELECT * FROM audit_logs WHERE 1=1'
  const params = []

  if (filters.user_id) {
    query += ' AND user_id = ?'
    params.push(filters.user_id)
  }

  if (filters.resource_type) {
    query += ' AND resource_type = ?'
    params.push(filters.resource_type)
  }

  if (filters.resource_id) {
    query += ' AND resource_id = ?'
    params.push(filters.resource_id)
  }

  if (filters.start_date) {
    query += ' AND timestamp >= ?'
    params.push(filters.start_date)
  }

  if (filters.end_date) {
    query += ' AND timestamp <= ?'
    params.push(filters.end_date)
  }

  if (filters.action) {
    query += ' AND action LIKE ?'
    params.push(`%${filters.action}%`)
  }

  query += ' ORDER BY timestamp DESC'

  if (filters.limit) {
    query += ' LIMIT ?'
    params.push(parseInt(filters.limit))
  }

  const stmt = db.prepare(query)
  return stmt.all(...params)
}

export default { auditMiddleware, getAuditLogs, logAudit }
