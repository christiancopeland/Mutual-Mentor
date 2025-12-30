import express from 'express'
import bcrypt from 'bcrypt'
import { body, validationResult } from 'express-validator'
import db from '../db/index.js'
import { generateToken, authenticate } from '../middleware/auth.js'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

// Password requirements
const PASSWORD_MIN_LENGTH = 12
const BCRYPT_ROUNDS = 12

/**
 * Validate password strength
 */
function validatePassword(password) {
  const errors = []

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return errors
}

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .escape()
      .withMessage('Name is required (max 100 characters)'),
    body('password')
      .isLength({ min: PASSWORD_MIN_LENGTH })
      .withMessage(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email, name, password } = req.body

      // Validate password strength
      const passwordErrors = validatePassword(password)
      if (passwordErrors.length > 0) {
        return res.status(400).json({
          error: 'Password does not meet requirements',
          details: passwordErrors
        })
      }

      // Check if user already exists
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' })
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

      // Create user
      const userId = uuidv4()
      db.prepare(`
        INSERT INTO users (id, email, name, password_hash)
        VALUES (?, ?, ?, ?)
      `).run(userId, email, name, passwordHash)

      // Create default settings for user
      db.prepare(`
        INSERT INTO settings (id, user_id)
        VALUES (?, ?)
      `).run(`settings_${userId}`, userId)

      // Generate token
      const user = { id: userId, email, name }
      const token = generateToken(user)

      res.status(201).json({
        message: 'User registered successfully',
        user: { id: userId, email, name },
        token
      })
    } catch (error) {
      console.error('Registration error:', error)
      res.status(500).json({ error: 'Registration failed' })
    }
  }
)

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
router.post('/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email, password } = req.body

      // Find user
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
      if (!user) {
        // Use generic message to prevent user enumeration
        return res.status(401).json({ error: 'Invalid email or password' })
      }

      // Check if user has a password (might be legacy default user)
      if (!user.password_hash) {
        return res.status(401).json({
          error: 'Account requires password setup. Please contact administrator.'
        })
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash)
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        name: user.name
      })

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token
      })
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({ error: 'Login failed' })
    }
  }
)

/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
router.get('/me', authenticate, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(req.user.id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user info' })
  }
})

/**
 * POST /api/auth/change-password
 * Change password (requires authentication)
 */
router.post('/change-password',
  authenticate,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: PASSWORD_MIN_LENGTH })
      .withMessage(`New password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { currentPassword, newPassword } = req.body

      // Validate new password strength
      const passwordErrors = validatePassword(newPassword)
      if (passwordErrors.length > 0) {
        return res.status(400).json({
          error: 'New password does not meet requirements',
          details: passwordErrors
        })
      }

      // Get user
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.password_hash)
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' })
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)

      // Update password
      db.prepare(`
        UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newPasswordHash, req.user.id)

      res.json({ message: 'Password changed successfully' })
    } catch (error) {
      console.error('Change password error:', error)
      res.status(500).json({ error: 'Failed to change password' })
    }
  }
)

/**
 * POST /api/auth/refresh
 * Refresh JWT token (requires valid current token)
 */
router.post('/refresh', authenticate, (req, res) => {
  try {
    const token = generateToken({
      id: req.user.id,
      email: req.user.email,
      name: req.user.name
    })

    res.json({ token })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({ error: 'Failed to refresh token' })
  }
})

export default router
