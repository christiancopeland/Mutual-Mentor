/**
 * Goals API Tests
 * Tests for goal setting and management
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import request from 'supertest'
import { getApp, registerTestUser } from './helpers.js'

describe('Goals API', () => {
  let app
  let testUser
  let testToken

  beforeAll(async () => {
    app = getApp()
    testUser = await registerTestUser({
      email: `goalstest_${Date.now()}@example.com`,
      name: 'Goals Test User',
      password: 'GoalsTestPass123!'
    })
    testToken = testUser.token
  })

  describe('GET /api/goals', () => {
    it('should return goals map by period type', async () => {
      const response = await request(app)
        .get('/api/goals')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
      expect(typeof response.body).toBe('object')
    })

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/goals')

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/goals/:periodType', () => {
    it('should return goals for specific period type', async () => {
      // First set some goals
      await request(app)
        .put('/api/goals/weekly')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ dials: 100, closes: 5 })

      const response = await request(app)
        .get('/api/goals/weekly')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
      expect(response.body.period_type).toBe('weekly')
    })

    it('should reject invalid period type', async () => {
      const response = await request(app)
        .get('/api/goals/invalid')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Invalid period type')
    })

    it('should accept all valid period types', async () => {
      const validTypes = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']

      for (const periodType of validTypes) {
        // Set goals first
        await request(app)
          .put(`/api/goals/${periodType}`)
          .set('Authorization', `Bearer ${testToken}`)
          .send({ dials: 10 })

        const response = await request(app)
          .get(`/api/goals/${periodType}`)
          .set('Authorization', `Bearer ${testToken}`)

        expect(response.status).toBe(200)
      }
    })
  })

  describe('PUT /api/goals/:periodType', () => {
    it('should create/update goals for a period', async () => {
      const goalData = {
        dials: 50,
        meetings_set: 10,
        kept_meetings: 8,
        closes: 3,
        lives: 5,
        points: 500
      }

      const response = await request(app)
        .put('/api/goals/monthly')
        .set('Authorization', `Bearer ${testToken}`)
        .send(goalData)

      expect(response.status).toBe(200)
      expect(response.body.dials).toBe(50)
      expect(response.body.closes).toBe(3)
      expect(response.body.points).toBe(500)
    })

    it('should reject invalid period type', async () => {
      const response = await request(app)
        .put('/api/goals/invalid')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ dials: 10 })

      expect(response.status).toBe(400)
    })

    it('should reject negative goal values', async () => {
      const response = await request(app)
        .put('/api/goals/weekly')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ dials: -5 })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('non-negative')
    })

    it('should reject non-numeric goal values', async () => {
      const response = await request(app)
        .put('/api/goals/weekly')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ dials: 'not-a-number' })

      expect(response.status).toBe(400)
    })

    it('should update existing goals', async () => {
      // Set initial goals
      await request(app)
        .put('/api/goals/quarterly')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ dials: 100, closes: 10 })

      // Update goals
      const response = await request(app)
        .put('/api/goals/quarterly')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ dials: 200, closes: 20 })

      expect(response.status).toBe(200)
      expect(response.body.dials).toBe(200)
      expect(response.body.closes).toBe(20)
    })

    it('should accept all goal metric fields', async () => {
      const allGoalFields = {
        days_worked: 5,
        meetings_made: 10,
        kept_meetings: 8,
        dials: 100,
        reached: 50,
        meetings_set: 15,
        meals: 3,
        qs_obtained: 5,
        qs_asked: 10,
        new_seen: 8,
        new_fact_finder: 4,
        case_opened: 3,
        joint_work: 2,
        plans: 4,
        closes: 3,
        points: 500,
        lives: 5,
        clients: 2,
        premium: 10000.50,
        meetings_ahead: 3
      }

      const response = await request(app)
        .put('/api/goals/yearly')
        .set('Authorization', `Bearer ${testToken}`)
        .send(allGoalFields)

      expect(response.status).toBe(200)
      expect(response.body.days_worked).toBe(5)
      expect(response.body.premium).toBe(10000.50)
    })
  })
})
