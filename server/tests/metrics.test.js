/**
 * Metrics API Tests
 * Tests for Granum metrics tracking and management
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import request from 'supertest'
import { getApp, registerTestUser } from './helpers.js'

describe('Metrics API', () => {
  let app
  let testUser
  let testToken

  beforeAll(async () => {
    app = getApp()
    testUser = await registerTestUser({
      email: `metricstest_${Date.now()}@example.com`,
      name: 'Metrics Test User',
      password: 'MetricsTestPass123!'
    })
    testToken = testUser.token
  })

  describe('GET /api/metrics', () => {
    it('should return daily metrics by default', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('period_type')
      expect(response.body).toHaveProperty('period_start')
      expect(response.body).toHaveProperty('period_end')
      expect(response.body).toHaveProperty('dials')
      expect(response.body).toHaveProperty('closes')
      expect(response.body).toHaveProperty('points')
    })

    it('should return metrics for specified period type', async () => {
      const periodTypes = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']

      for (const periodType of periodTypes) {
        const response = await request(app)
          .get(`/api/metrics?period_type=${periodType}`)
          .set('Authorization', `Bearer ${testToken}`)

        expect(response.status).toBe(200)
        expect(response.body.period_type).toBe(periodType)
      }
    })

    it('should reject invalid period type', async () => {
      const response = await request(app)
        .get('/api/metrics?period_type=invalid')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Invalid period_type')
    })

    it('should accept custom date parameter', async () => {
      const response = await request(app)
        .get('/api/metrics?date=2024-06-15')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
    })

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/metrics')

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/metrics/summary', () => {
    it('should return metrics summary for all timeframes', async () => {
      const response = await request(app)
        .get('/api/metrics/summary')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('daily')
      expect(response.body).toHaveProperty('weekly')
      expect(response.body).toHaveProperty('monthly')
      expect(response.body).toHaveProperty('quarterly')
      expect(response.body).toHaveProperty('yearly')
    })
  })

  describe('PUT /api/metrics', () => {
    it('should update metrics for a period', async () => {
      const metricsData = {
        period_type: 'daily',
        dials: 25,
        meetings_set: 5,
        kept_meetings: 3,
        closes: 1,
        points: 100
      }

      const response = await request(app)
        .put('/api/metrics')
        .set('Authorization', `Bearer ${testToken}`)
        .send(metricsData)

      expect(response.status).toBe(200)
      expect(response.body.dials).toBe(25)
      expect(response.body.points).toBe(100)
    })

    it('should require period_type', async () => {
      const response = await request(app)
        .put('/api/metrics')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          dials: 10
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('period_type is required')
    })

    it('should reject invalid period_type', async () => {
      const response = await request(app)
        .put('/api/metrics')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          period_type: 'invalid',
          dials: 10
        })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/metrics/entry', () => {
    it('should log a single metric entry', async () => {
      const response = await request(app)
        .post('/api/metrics/entry')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          metric_type: 'dials',
          value: 5,
          notes: 'Morning calls'
        })

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body.metric_type).toBe('dials')
      expect(response.body.value).toBe(5)
    })

    it('should default value to 1', async () => {
      const response = await request(app)
        .post('/api/metrics/entry')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          metric_type: 'closes'
        })

      expect(response.status).toBe(201)
      expect(response.body.value).toBe(1)
    })

    it('should require metric_type', async () => {
      const response = await request(app)
        .post('/api/metrics/entry')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          value: 5
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('metric_type is required')
    })

    it('should reject invalid metric_type', async () => {
      const response = await request(app)
        .post('/api/metrics/entry')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          metric_type: 'invalid_metric'
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Invalid metric_type')
    })

    it('should validate value is a number', async () => {
      const response = await request(app)
        .post('/api/metrics/entry')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          metric_type: 'dials',
          value: 'not-a-number'
        })

      expect(response.status).toBe(400)
    })

    it('should validate notes length', async () => {
      const response = await request(app)
        .post('/api/metrics/entry')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          metric_type: 'dials',
          notes: 'X'.repeat(1001)
        })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('notes too long')
    })

    it('should accept all valid metric types', async () => {
      const validTypes = [
        'days_worked', 'meetings_made', 'kept_meetings', 'dials', 'reached',
        'meetings_set', 'meals', 'qs_obtained', 'qs_asked', 'new_seen',
        'new_fact_finder', 'case_opened', 'joint_work', 'plans', 'closes',
        'points', 'lives', 'clients', 'premium', 'meetings_ahead'
      ]

      for (const metricType of validTypes) {
        const response = await request(app)
          .post('/api/metrics/entry')
          .set('Authorization', `Bearer ${testToken}`)
          .send({ metric_type: metricType })

        expect(response.status).toBe(201)
      }
    })
  })

  describe('POST /api/metrics/recalculate', () => {
    it('should recalculate all period metrics', async () => {
      const response = await request(app)
        .post('/api/metrics/recalculate')
        .set('Authorization', `Bearer ${testToken}`)
        .send({})

      expect(response.status).toBe(200)
      expect(response.body.message).toContain('Successfully recalculated')
      expect(response.body).toHaveProperty('metrics')
    })
  })

  describe('GET /api/metrics/aggregated/:period_type', () => {
    it('should return aggregated metrics for period type', async () => {
      const response = await request(app)
        .get('/api/metrics/aggregated/weekly')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(200)
      expect(response.body.period_type).toBe('weekly')
      expect(response.body).toHaveProperty('period_start')
      expect(response.body).toHaveProperty('period_end')
    })

    it('should reject invalid period type', async () => {
      const response = await request(app)
        .get('/api/metrics/aggregated/invalid')
        .set('Authorization', `Bearer ${testToken}`)

      expect(response.status).toBe(400)
    })
  })
})
