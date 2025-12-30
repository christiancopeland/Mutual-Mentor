import express from 'express'
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  togglePipelineStep,
  getPipelineSteps,
  getClientStats
} from '../db/index.js'

const router = express.Router()

// Get all pipeline steps
router.get('/pipeline/steps', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const steps = getPipelineSteps(userId)
    res.json(steps)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pipeline steps' })
  }
})

// Get all clients
router.get('/', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const { status, search, sort } = req.query
    const filters = {}

    if (status) filters.status = status
    if (search) filters.search = search
    if (sort) filters.sort = sort

    const clients = getAllClients(userId, filters)
    res.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error.message)
    res.status(500).json({ error: 'Failed to fetch clients' })
  }
})

// Get client statistics
router.get('/stats', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const stats = getClientStats(userId)
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch client statistics' })
  }
})

// Get single client by ID
router.get('/:id', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const client = getClientById(req.params.id, userId)

    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }

    res.json(client)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch client' })
  }
})

// Create new client
router.post('/', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const { first_name, last_name, phone, email, referral_source, jw_partner, notes } = req.body

    // Server-side validation (MEDIUM-1)
    if (!first_name || first_name.trim() === '') {
      return res.status(400).json({ error: 'Client first name is required' })
    }
    if (first_name.length > 50) {
      return res.status(400).json({ error: 'First name too long (max 50 characters)' })
    }

    if (!last_name || last_name.trim() === '') {
      return res.status(400).json({ error: 'Client last name is required' })
    }
    if (last_name.length > 50) {
      return res.status(400).json({ error: 'Last name too long (max 50 characters)' })
    }

    // Email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Phone validation (US format)
    if (phone && !/^[\d\s\-\(\)\+\.]*$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone format' })
    }

    // Notes length limit
    if (notes && notes.length > 5000) {
      return res.status(400).json({ error: 'Notes too long (max 5000 characters)' })
    }

    const client = createClient({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone?.trim() || null,
      email: email?.trim().toLowerCase() || null,
      referral_source: referral_source?.trim() || null,
      jw_partner: jw_partner?.trim() || null,
      notes: notes?.trim() || null
    }, userId)

    res.status(201).json(client)
  } catch (error) {
    res.status(500).json({ error: 'Failed to create client' })
  }
})

// Update client
router.put('/:id', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user

    // Validate input lengths
    if (req.body.first_name && req.body.first_name.length > 50) {
      return res.status(400).json({ error: 'First name too long (max 50 characters)' })
    }
    if (req.body.last_name && req.body.last_name.length > 50) {
      return res.status(400).json({ error: 'Last name too long (max 50 characters)' })
    }
    if (req.body.notes && req.body.notes.length > 5000) {
      return res.status(400).json({ error: 'Notes too long (max 5000 characters)' })
    }
    if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    const client = updateClient(req.params.id, req.body, userId)

    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }

    res.json(client)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update client' })
  }
})

// Delete client
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const success = deleteClient(req.params.id, userId)

    if (!success) {
      return res.status(404).json({ error: 'Client not found' })
    }

    res.json({ message: 'Client deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete client' })
  }
})

// Mark step as complete
router.post('/:id/steps/:stepNumber/complete', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const { id, stepNumber } = req.params
    const client = togglePipelineStep(id, parseInt(stepNumber), true, userId)

    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }

    res.json(client)
  } catch (error) {
    // togglePipelineStep throws 'Client not found' if client doesn't exist
    if (error.message === 'Client not found') {
      return res.status(404).json({ error: 'Client not found' })
    }
    res.status(500).json({ error: 'Failed to complete step' })
  }
})

// Mark step as incomplete
router.post('/:id/steps/:stepNumber/uncomplete', (req, res) => {
  try {
    const userId = req.user.id // CRITICAL-2: Use authenticated user
    const { id, stepNumber } = req.params
    const client = togglePipelineStep(id, parseInt(stepNumber), false, userId)

    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }

    res.json(client)
  } catch (error) {
    res.status(500).json({ error: 'Failed to uncomplete step' })
  }
})

export default router
