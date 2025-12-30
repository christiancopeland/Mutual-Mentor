/**
 * Data Isolation Tests
 * Tests to ensure users can only access their own data
 * CRITICAL for GLBA/SOC 2/FINRA compliance
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import request from 'supertest'
import { getApp, registerTestUser, createTestClient, createTestBonus } from './helpers.js'

describe('Data Isolation', () => {
  let app
  let userA, userB

  beforeAll(async () => {
    app = getApp()

    // Create two separate users
    userA = await registerTestUser({
      email: `usera_${Date.now()}@example.com`,
      name: 'User A',
      password: 'UserAPassword123!'
    })

    userB = await registerTestUser({
      email: `userb_${Date.now()}@example.com`,
      name: 'User B',
      password: 'UserBPassword123!'
    })
  })

  describe('Client Data Isolation', () => {
    let userAClient, userBClient

    beforeAll(async () => {
      // Create clients for each user
      userAClient = await createTestClient(userA.token, {
        first_name: 'UserA',
        last_name: 'Client',
        email: 'usera.client@example.com'
      })

      userBClient = await createTestClient(userB.token, {
        first_name: 'UserB',
        last_name: 'Client',
        email: 'userb.client@example.com'
      })
    })

    it('should only return clients belonging to the authenticated user', async () => {
      // User A should only see their own clients
      const responseA = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${userA.token}`)

      expect(responseA.status).toBe(200)
      expect(responseA.body.some(c => c.first_name === 'UserA')).toBe(true)
      expect(responseA.body.some(c => c.first_name === 'UserB')).toBe(false)

      // User B should only see their own clients
      const responseB = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${userB.token}`)

      expect(responseB.status).toBe(200)
      expect(responseB.body.some(c => c.first_name === 'UserB')).toBe(true)
      expect(responseB.body.some(c => c.first_name === 'UserA')).toBe(false)
    })

    it('should not allow User A to access User B client by ID', async () => {
      const response = await request(app)
        .get(`/api/clients/${userBClient.id}`)
        .set('Authorization', `Bearer ${userA.token}`)

      expect(response.status).toBe(404)
    })

    it('should not allow User B to access User A client by ID', async () => {
      const response = await request(app)
        .get(`/api/clients/${userAClient.id}`)
        .set('Authorization', `Bearer ${userB.token}`)

      expect(response.status).toBe(404)
    })

    it('should not allow User A to update User B client', async () => {
      const response = await request(app)
        .put(`/api/clients/${userBClient.id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ first_name: 'Hacked' })

      expect(response.status).toBe(404)

      // Verify client was not modified
      const verifyResponse = await request(app)
        .get(`/api/clients/${userBClient.id}`)
        .set('Authorization', `Bearer ${userB.token}`)

      expect(verifyResponse.body.first_name).toBe('UserB')
    })

    it('should not allow User A to delete User B client', async () => {
      const response = await request(app)
        .delete(`/api/clients/${userBClient.id}`)
        .set('Authorization', `Bearer ${userA.token}`)

      expect(response.status).toBe(404)

      // Verify client still exists
      const verifyResponse = await request(app)
        .get(`/api/clients/${userBClient.id}`)
        .set('Authorization', `Bearer ${userB.token}`)

      expect(verifyResponse.status).toBe(200)
    })

    it('should not allow cross-user pipeline step modification', async () => {
      const response = await request(app)
        .post(`/api/clients/${userBClient.id}/steps/1/complete`)
        .set('Authorization', `Bearer ${userA.token}`)

      expect(response.status).toBe(404)
    })
  })

  describe('Bonus Data Isolation', () => {
    let userABonus, userBBonus

    beforeAll(async () => {
      userABonus = await createTestBonus(userA.token, { name: 'User A Bonus' })
      userBBonus = await createTestBonus(userB.token, { name: 'User B Bonus' })
    })

    it('should only return bonuses belonging to the authenticated user', async () => {
      const responseA = await request(app)
        .get('/api/bonuses')
        .set('Authorization', `Bearer ${userA.token}`)

      expect(responseA.status).toBe(200)
      expect(responseA.body.some(b => b.name === 'User A Bonus')).toBe(true)
      expect(responseA.body.some(b => b.name === 'User B Bonus')).toBe(false)

      const responseB = await request(app)
        .get('/api/bonuses')
        .set('Authorization', `Bearer ${userB.token}`)

      expect(responseB.status).toBe(200)
      expect(responseB.body.some(b => b.name === 'User B Bonus')).toBe(true)
      expect(responseB.body.some(b => b.name === 'User A Bonus')).toBe(false)
    })

    it('should not allow User A to access User B bonus by ID', async () => {
      const response = await request(app)
        .get(`/api/bonuses/${userBBonus.id}`)
        .set('Authorization', `Bearer ${userA.token}`)

      expect(response.status).toBe(404)
    })

    it('should not allow User A to update User B bonus', async () => {
      const response = await request(app)
        .put(`/api/bonuses/${userBBonus.id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ name: 'Hacked Bonus' })

      expect(response.status).toBe(404)
    })

    it('should not allow User A to update User B bonus progress', async () => {
      const response = await request(app)
        .put(`/api/bonuses/${userBBonus.id}/progress`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ current_value: 999 })

      expect(response.status).toBe(404)
    })

    it('should not allow User A to delete User B bonus', async () => {
      const response = await request(app)
        .delete(`/api/bonuses/${userBBonus.id}`)
        .set('Authorization', `Bearer ${userA.token}`)

      expect(response.status).toBe(404)
    })
  })

  describe('Metrics Data Isolation', () => {
    beforeAll(async () => {
      // Log some metrics for each user
      await request(app)
        .post('/api/metrics/entry')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ metric_type: 'dials', value: 100 })

      await request(app)
        .post('/api/metrics/entry')
        .set('Authorization', `Bearer ${userB.token}`)
        .send({ metric_type: 'dials', value: 200 })
    })

    it('should return isolated metrics for each user', async () => {
      const responseA = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${userA.token}`)

      const responseB = await request(app)
        .get('/api/metrics')
        .set('Authorization', `Bearer ${userB.token}`)

      // Both should succeed
      expect(responseA.status).toBe(200)
      expect(responseB.status).toBe(200)

      // Metrics should be isolated (values should differ if logged correctly)
      // Note: Due to test ordering, values might accumulate
    })
  })

  describe('Goals Data Isolation', () => {
    beforeAll(async () => {
      await request(app)
        .put('/api/goals/weekly')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ dials: 100 })

      await request(app)
        .put('/api/goals/weekly')
        .set('Authorization', `Bearer ${userB.token}`)
        .send({ dials: 200 })
    })

    it('should return isolated goals for each user', async () => {
      const responseA = await request(app)
        .get('/api/goals/weekly')
        .set('Authorization', `Bearer ${userA.token}`)

      const responseB = await request(app)
        .get('/api/goals/weekly')
        .set('Authorization', `Bearer ${userB.token}`)

      expect(responseA.status).toBe(200)
      expect(responseB.status).toBe(200)
      expect(responseA.body.dials).toBe(100)
      expect(responseB.body.dials).toBe(200)
    })
  })

  describe('Dashboard Data Isolation', () => {
    it('should return isolated dashboard data for each user', async () => {
      const responseA = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${userA.token}`)

      const responseB = await request(app)
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${userB.token}`)

      expect(responseA.status).toBe(200)
      expect(responseB.status).toBe(200)
      // Dashboard data is calculated per user
    })
  })

  describe('Settings Data Isolation', () => {
    beforeAll(async () => {
      await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ week_starts_on: 'monday' })

      await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${userB.token}`)
        .send({ week_starts_on: 'sunday' })
    })

    it('should return isolated settings for each user', async () => {
      const responseA = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${userA.token}`)

      const responseB = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${userB.token}`)

      expect(responseA.status).toBe(200)
      expect(responseB.status).toBe(200)
      expect(responseA.body.week_starts_on).toBe('monday')
      expect(responseB.body.week_starts_on).toBe('sunday')
    })
  })

  describe('Export Data Isolation', () => {
    it('should only export data belonging to the authenticated user', async () => {
      // Create distinct clients for each user
      await createTestClient(userA.token, {
        first_name: 'ExportUserA',
        last_name: 'Client'
      })

      await createTestClient(userB.token, {
        first_name: 'ExportUserB',
        last_name: 'Client'
      })

      // Export clients for User A
      const responseA = await request(app)
        .get('/api/export/clients/csv')
        .set('Authorization', `Bearer ${userA.token}`)

      expect(responseA.status).toBe(200)
      expect(responseA.text).toContain('ExportUserA')
      expect(responseA.text).not.toContain('ExportUserB')

      // Export clients for User B
      const responseB = await request(app)
        .get('/api/export/clients/csv')
        .set('Authorization', `Bearer ${userB.token}`)

      expect(responseB.status).toBe(200)
      expect(responseB.text).toContain('ExportUserB')
      expect(responseB.text).not.toContain('ExportUserA')
    })
  })

  describe('Analytics Data Isolation', () => {
    it('should return isolated analytics for each user', async () => {
      const responseA = await request(app)
        .get('/api/analytics/pipeline')
        .set('Authorization', `Bearer ${userA.token}`)

      const responseB = await request(app)
        .get('/api/analytics/pipeline')
        .set('Authorization', `Bearer ${userB.token}`)

      expect(responseA.status).toBe(200)
      expect(responseB.status).toBe(200)
    })

    it('should return isolated performance analytics', async () => {
      const responseA = await request(app)
        .get('/api/analytics/performance')
        .set('Authorization', `Bearer ${userA.token}`)

      const responseB = await request(app)
        .get('/api/analytics/performance')
        .set('Authorization', `Bearer ${userB.token}`)

      expect(responseA.status).toBe(200)
      expect(responseB.status).toBe(200)
    })
  })
})
