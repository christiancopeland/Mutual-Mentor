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
    const steps = getPipelineSteps()
    res.json(steps)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all clients
router.get('/', (req, res) => {
  try {
    const { status, search, sort } = req.query
    const filters = {}

    if (status) filters.status = status
    if (search) filters.search = search
    if (sort) filters.sort = sort

    const clients = getAllClients('default', filters)
    res.json(clients)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get client statistics
router.get('/stats', (req, res) => {
  try {
    const stats = getClientStats()
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single client by ID
router.get('/:id', (req, res) => {
  try {
    const client = getClientById(req.params.id)

    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }

    res.json(client)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new client
router.post('/', (req, res) => {
  try {
    const { first_name, last_name, phone, email, referral_source, jw_partner, notes } = req.body

    if (!first_name || first_name.trim() === '') {
      return res.status(400).json({ error: 'Client first name is required' })
    }

    if (!last_name || last_name.trim() === '') {
      return res.status(400).json({ error: 'Client last name is required' })
    }

    const client = createClient({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone,
      email,
      referral_source,
      jw_partner,
      notes
    })

    res.status(201).json(client)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update client
router.put('/:id', (req, res) => {
  try {
    const client = updateClient(req.params.id, req.body)

    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }

    res.json(client)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete client
router.delete('/:id', (req, res) => {
  try {
    const success = deleteClient(req.params.id)

    if (!success) {
      return res.status(404).json({ error: 'Client not found' })
    }

    res.json({ message: 'Client deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Mark step as complete
router.post('/:id/steps/:stepNumber/complete', (req, res) => {
  try {
    const { id, stepNumber } = req.params
    const client = togglePipelineStep(id, parseInt(stepNumber), true)

    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }

    res.json(client)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Mark step as incomplete
router.post('/:id/steps/:stepNumber/uncomplete', (req, res) => {
  try {
    const { id, stepNumber } = req.params
    const client = togglePipelineStep(id, parseInt(stepNumber), false)

    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }

    res.json(client)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
