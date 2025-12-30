import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION_USE_STRONG_SECRET'

// Warn if using default secret
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET not set in environment. Using default secret.')
  console.warn('⚠️  This is insecure! Set JWT_SECRET environment variable for production.')
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export function authenticate(req, res, next) {
  try {
    const authHeader = req.header('Authorization')

    if (!authHeader) {
      return res.status(401).json({ error: 'Access denied. No token provided.' })
    }

    // Support both "Bearer <token>" and just "<token>"
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' })
    }

    const verified = jwt.verify(token, JWT_SECRET)
    req.user = verified
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' })
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' })
    }
    res.status(400).json({ error: 'Token verification failed.' })
  }
}

/**
 * Optional authentication - doesn't fail if no token
 * Useful for routes that can work with or without auth
 */
export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.header('Authorization')

    if (!authHeader) {
      req.user = null
      return next()
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader

    if (!token) {
      req.user = null
      return next()
    }

    const verified = jwt.verify(token, JWT_SECRET)
    req.user = verified
    next()
  } catch (err) {
    // Token invalid but we don't fail - just set user to null
    req.user = null
    next()
  }
}

/**
 * Generate JWT token for user
 */
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '24h' }
  )
}

/**
 * Get JWT secret (for internal use)
 */
export function getJwtSecret() {
  return JWT_SECRET
}

export default { authenticate, optionalAuth, generateToken, getJwtSecret }
