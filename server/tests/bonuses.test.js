/**
 * Bonuses API Tests
 * Tests for bonus challenge tracking
 */

import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import { getApp, registerTestUser, createTestBonus } from './helpers.js'

describe('Bonuses API', () => {
  let app
  let testUser
  let testToken

  beforeAll(async () => {
    app = getApp()
    testUser = await registerTestUser({
      email: `bonustest_${Date.now()}@example.com`,
      name: 'Bonus Test User',
      password: 'BonusTestPass123!'
    })
    testToken = testUser.token
  })

  describe('GET /api/bonuses', () => {
    it('should return empty array when no bonuses exist', async () => {
      const newUser = await registerTestUser()

      const response = await request(app)
        .get('/api/bonuses')
        .set('Authorization', `Bearer ${newUser.token}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
    })

    it('should return bonuses for authenticated user', async () => {
      await createTestBonus(testToken, { name: 'List Test Bonus' })

      const response = await request(app)
        .get('/api/bonuses')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.length).toBeGreaterThan(0)
    })

    it('should include calculated fields', async () => {
      await createTestBonus(testToken, {
        name: 'Calculated Fields Bonus',
        target_value: 100
      })

      const response = await request(app)
        .get('/api/bonuses')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
      const bonus = response.body.find(b => b.name === 'Calculated Fields Bonus')
      expect(bonus).toHaveProperty('days_remaining')
      expect(bonus).toHaveProperty('progress_percentage')
    })

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/bonuses?status=active')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
      response.body.forEach(bonus => {
        expect(bonus.status).toBe('active')
      })
    })

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/bonuses')

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/bonuses', () => {
    it('should create a new bonus with valid data', async () => {
      const today = new Date()
      const deadline = new Date(today)
      deadline.setMonth(deadline.getMonth() + 1)

      const bonusData = {
        name: 'New Bonus Challenge',
        description: 'Test description',
        metric_type: 'closes',
        target_value: 50,
        start_date: today.toISOString().split('T')[0],
        deadline: deadline.toISOString().split('T')[0]
      }

      const response = await request(app)
        .post('/api/bonuses')
        .set('Authorization', `Bearer ${testToken}`)
        .send(bonusData)

      expect(response.status).toBe(201)
      expect(response.body.name).toBe(bonusData.name)
      expect(response.body.metric_type).toBe('closes')
      expect(response.body.target_value).toBe(50)
      expect(response.body.status).toBe('active')
      expect(response.body.current_value).toBe(0)
    })

    it('should require name', async () => {
      const response = await request(app)
        .post('/api/bonuses')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          metric_type: 'dials',
          target_value: 100,
          start_date: '2024-01-01',
          deadline: '2024-12-31'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('name')
    })

    it('should require metric_type', async () => {
      const response = await request(app)
        .post('/api/bonuses')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'No Metric Type',
          target_value: 100,
          start_date: '2024-01-01',
          deadline: '2024-12-31'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('metric_type')
    })

    it('should require positive target_value', async () => {
      const response = await request(app)
        .post('/api/bonuses')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Zero Target',
          metric_type: 'dials',
          target_value: 0,
          start_date: '2024-01-01',
          deadline: '2024-12-31'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('target_value')
    })

    it('should reject name too long', async () => {
      const response = await request(app)
        .post('/api/bonuses')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'X'.repeat(101),
          metric_type: 'dials',
          target_value: 100,
          start_date: '2024-01-01',
          deadline: '2024-12-31'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('too long')
    })

    it('should reject invalid metric_type', async () => {
      const response = await request(app)
        .post('/api/bonuses')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Invalid Metric',
          metric_type: 'invalid',
          target_value: 100,
          start_date: '2024-01-01',
          deadline: '2024-12-31'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Invalid metric_type')
    })

    it('should reject deadline before start_date', async () => {
      const response = await request(app)
        .post('/api/bonuses')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Bad Dates',
          metric_type: 'dials',
          target_value: 100,
          start_date: '2024-12-31',
          deadline: '2024-01-01'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('after start date')
    })

    it('should accept all valid metric types', async () => {
      const validTypes = [
        'dials', 'meetings_set', 'kept_meetings', 'closes',
        'plans', 'lives', 'clients', 'premium', 'referrals',
        'fact_finders', 'meetings_ahead', 'points', 'custom'
      ]

      const today = new Date()
      const deadline = new Date(today)
      deadline.setMonth(deadline.getMonth() + 1)

      for (const metricType of validTypes) {
        const response = await request(app)
          .post('/api/bonuses')
          .set('Authorization', `Bearer ${testToken}`)
          .send({
            name: `${metricType} Bonus`,
            metric_type: metricType,
            target_value: 100,
            start_date: today.toISOString().split('T')[0],
            deadline: deadline.toISOString().split('T')[0]
          })

        expect(response.status).toBe(201)
      }
    })
  })

  describe('GET /api/bonuses/:id', () => {
    let testBonus

    beforeAll(async () => {
      testBonus = await createTestBonus(testToken, { name: 'Get By ID Bonus' })
    })

    it('should return bonus by ID', async () => {
      const response = await request(app)
        .get(`/api/bonuses/${testBonus.id}`)
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(testBonus.id)
      expect(response.body.name).toBe('Get By ID Bonus')
    })

    it('should return 404 for non-existent bonus', async () => {
      const response = await request(app)
        .get('/api/bonuses/nonexistent-id-12345')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/bonuses/:id', () => {
    let testBonus

    beforeEach(async () => {
      testBonus = await createTestBonus(testToken, { name: 'Update Test Bonus' })
    })

    it('should update bonus fields', async () => {
      const response = await request(app)
        .put(`/api/bonuses/${testBonus.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Updated Bonus Name',
          description: 'Updated description'
        })

      expect(response.status).toBe(200)
      expect(response.body.name).toBe('Updated Bonus Name')
      expect(response.body.description).toBe('Updated description')
    })

    it('should return 404 for non-existent bonus', async () => {
      const response = await request(app)
        .put('/api/bonuses/nonexistent-id-12345')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Updated' })

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/bonuses/:id/progress', () => {
    let testBonus

    beforeEach(async () => {
      testBonus = await createTestBonus(testToken, {
        name: 'Progress Test Bonus',
        target_value: 100
      })
    })

    it('should update bonus progress', async () => {
      const response = await request(app)
        .put(`/api/bonuses/${testBonus.id}/progress`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ current_value: 50 })

      expect(response.status).toBe(200)
      expect(response.body.current_value).toBe(50)
      expect(response.body.progress_percentage).toBe(50)
    })

    it('should auto-complete when target reached', async () => {
      const response = await request(app)
        .put(`/api/bonuses/${testBonus.id}/progress`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ current_value: 100 })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('completed')
    })

    it('should reject negative current_value', async () => {
      const response = await request(app)
        .put(`/api/bonuses/${testBonus.id}/progress`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ current_value: -5 })

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/bonuses/:id', () => {
    it('should archive a bonus (soft delete)', async () => {
      const bonus = await createTestBonus(testToken, { name: 'To Delete Bonus' })

      const response = await request(app)
        .delete(`/api/bonuses/${bonus.id}`)
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
      expect(response.body.message).toBe('Bonus archived successfully')

      // Verify bonus is archived, not deleted
      const getResponse = await request(app)
        .get(`/api/bonuses/${bonus.id}`)
        .set('Authorization', `Bearer ${testToken}`)

      expect(getResponse.status).toBe(200)
      expect(getResponse.body.status).toBe('archived')
    })

    it('should return 404 for non-existent bonus', async () => {
      const response = await request(app)
        .delete('/api/bonuses/nonexistent-id-12345')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(404)
    })
  })
})
