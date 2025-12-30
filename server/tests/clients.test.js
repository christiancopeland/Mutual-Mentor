/**
 * Clients API Tests
 * Tests for client CRUD operations and pipeline management
 */

import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import { getApp, registerTestUser, createTestClient } from './helpers.js'

describe('Clients API', () => {
  let app
  let testUser
  let testToken

  beforeAll(async () => {
    app = getApp()
    testUser = await registerTestUser({
      email: `clientstest_${Date.now()}@example.com`,
      name: 'Clients Test User',
      password: 'ClientsTestPass123!'
    })
    testToken = testUser.token
  })

  describe('GET /api/clients', () => {
    it('should return empty array when no clients exist', async () => {
      const newUser = await registerTestUser()

      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${newUser.token}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
    })

    it('should return clients for authenticated user', async () => {
      // Create a client first
      await createTestClient(testToken, {
        first_name: 'List',
        last_name: 'TestClient'
      })

      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
    })

    it('should filter clients by status', async () => {
      const response = await request(app)
        .get('/api/clients?status=active')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
    })

    it('should search clients by name', async () => {
      await createTestClient(testToken, {
        first_name: 'Searchable',
        last_name: 'ClientName'
      })

      const response = await request(app)
        .get('/api/clients?search=Searchable')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
      expect(response.body.some(c => c.first_name === 'Searchable')).toBe(true)
    })

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/clients')

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/clients', () => {
    it('should create a new client with valid data', async () => {
      const clientData = {
        first_name: 'New',
        last_name: 'Client',
        phone: '(555) 987-6543',
        email: 'new.client@example.com',
        referral_source: 'Friend',
        notes: 'Test notes'
      }

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${testToken}`)
        .send(clientData)

      expect(response.status).toBe(201)
      expect(response.body.first_name).toBe(clientData.first_name)
      expect(response.body.last_name).toBe(clientData.last_name)
      expect(response.body.email).toBe(clientData.email)
      expect(response.body).toHaveProperty('id')
      expect(response.body.current_step).toBe(1)
      expect(response.body.status).toBe('active')
    })

    it('should create client with minimum required fields', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          first_name: 'Minimal',
          last_name: 'Client'
        })

      expect(response.status).toBe(201)
      expect(response.body.first_name).toBe('Minimal')
    })

    it('should reject client without first_name', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          last_name: 'NoFirstName'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('first name')
    })

    it('should reject client without last_name', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          first_name: 'NoLastName'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('last name')
    })

    it('should reject client with invalid email format', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          first_name: 'Bad',
          last_name: 'Email',
          email: 'not-an-email'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('email')
    })

    it('should reject client with first_name too long', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          first_name: 'A'.repeat(51),
          last_name: 'TooLong'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('too long')
    })

    it('should reject client with notes too long', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          first_name: 'Long',
          last_name: 'Notes',
          notes: 'X'.repeat(5001)
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Notes too long')
    })

    it('should trim whitespace from names', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          first_name: '  Trimmed  ',
          last_name: '  Name  '
        })

      expect(response.status).toBe(201)
      expect(response.body.first_name).toBe('Trimmed')
      expect(response.body.last_name).toBe('Name')
    })

    it('should lowercase email', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          first_name: 'Email',
          last_name: 'Test',
          email: 'UPPERCASE@EXAMPLE.COM'
        })

      expect(response.status).toBe(201)
      expect(response.body.email).toBe('uppercase@example.com')
    })
  })

  describe('GET /api/clients/:id', () => {
    let testClient

    beforeAll(async () => {
      testClient = await createTestClient(testToken, {
        first_name: 'GetById',
        last_name: 'TestClient'
      })
    })

    it('should return client by ID', async () => {
      const response = await request(app)
        .get(`/api/clients/${testClient.id}`)
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(testClient.id)
      expect(response.body.first_name).toBe('GetById')
    })

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .get('/api/clients/nonexistent-id-12345')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/clients/:id', () => {
    let testClient

    beforeEach(async () => {
      testClient = await createTestClient(testToken, {
        first_name: 'Update',
        last_name: 'Test',
        email: 'update.test@example.com'
      })
    })

    it('should update client fields', async () => {
      const response = await request(app)
        .put(`/api/clients/${testClient.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          first_name: 'Updated',
          notes: 'Updated notes'
        })

      expect(response.status).toBe(200)
      expect(response.body.first_name).toBe('Updated')
      expect(response.body.notes).toBe('Updated notes')
      expect(response.body.last_name).toBe('Test') // Unchanged
    })

    it('should update client status', async () => {
      const response = await request(app)
        .put(`/api/clients/${testClient.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          status: 'stalled'
        })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('stalled')
    })

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .put('/api/clients/nonexistent-id-12345')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          first_name: 'Updated'
        })

      expect(response.status).toBe(404)
    })

    it('should validate email format on update', async () => {
      const response = await request(app)
        .put(`/api/clients/${testClient.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          email: 'invalid-email'
        })

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/clients/:id', () => {
    it('should delete a client', async () => {
      const client = await createTestClient(testToken, {
        first_name: 'ToDelete',
        last_name: 'Client'
      })

      const response = await request(app)
        .delete(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Client deleted successfully')

      // Verify client is deleted
      const getResponse = await request(app)
        .get(`/api/clients/${client.id}`)
        .set('Authorization', `Bearer ${testToken}`)

      expect(getResponse.status).toBe(404)
    })

    it('should return 404 for non-existent client', async () => {
      const response = await request(app)
        .delete('/api/clients/nonexistent-id-12345')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('Pipeline Steps', () => {
    let testClient

    beforeEach(async () => {
      testClient = await createTestClient(testToken, {
        first_name: 'Pipeline',
        last_name: 'TestClient'
      })
    })

    it('should complete a pipeline step', async () => {
      const response = await request(app)
        .post(`/api/clients/${testClient.id}/steps/1/complete`)
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
      expect(response.body.completed_steps).toContain(1)
      expect(response.body.current_step).toBe(2)
    })

    it('should uncomplete a pipeline step', async () => {
      // First complete the step
      await request(app)
        .post(`/api/clients/${testClient.id}/steps/1/complete`)
        .set('Authorization', `Bearer ${testToken}`)

      // Then uncomplete it
      const response = await request(app)
        .post(`/api/clients/${testClient.id}/steps/1/uncomplete`)
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
      expect(response.body.completed_steps).not.toContain(1)
    })

    it('should auto-complete client when all 43 steps are done', async () => {
      // Complete all 43 steps
      for (let step = 1; step <= 43; step++) {
        await request(app)
          .post(`/api/clients/${testClient.id}/steps/${step}/complete`)
          .set('Authorization', `Bearer ${testToken}`)
      }

      // Get the client
      const response = await request(app)
        .get(`/api/clients/${testClient.id}`)
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('completed')
      expect(response.body.completed_steps.length).toBe(43)
    })
  })

  describe('GET /api/clients/stats', () => {
    it('should return client statistics', async () => {
      const response = await request(app)
        .get('/api/clients/stats')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('total_steps_completed')
    })
  })

  describe('GET /api/clients/pipeline/steps', () => {
    it('should return pipeline steps', async () => {
      const response = await request(app)
        .get('/api/clients/pipeline/steps')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
    })
  })
})
