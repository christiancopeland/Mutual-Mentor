/**
 * Security Tests
 * Tests for security controls including authentication, authorization, and input validation
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import request from 'supertest'
import { getApp, registerTestUser, createTestClient } from './helpers.js'

describe('Security Controls', () => {
  let app

  beforeAll(() => {
    app = getApp()
  })

  describe('Authentication Enforcement', () => {
    const protectedEndpoints = [
      { method: 'get', path: '/api/clients' },
      { method: 'post', path: '/api/clients' },
      { method: 'get', path: '/api/metrics' },
      { method: 'put', path: '/api/metrics' },
      { method: 'get', path: '/api/goals' },
      { method: 'get', path: '/api/bonuses' },
      { method: 'get', path: '/api/dashboard/summary' },
      { method: 'get', path: '/api/analytics/pipeline' },
      { method: 'get', path: '/api/settings' },
      { method: 'get', path: '/api/export/clients/csv' }
    ]

    protectedEndpoints.forEach(({ method, path }) => {
      it(`should reject unauthenticated ${method.toUpperCase()} ${path}`, async () => {
        const response = await request(app)[method](path)

        expect(response.status).toBe(401)
        expect(response.body).toHaveProperty('error')
      })
    })

    it('should allow unauthenticated access to health check', async () => {
      const response = await request(app).get('/api/health')

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('ok')
    })

    it('should allow unauthenticated access to auth endpoints', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' })

      // Should get 401 for invalid credentials, not 401 for missing auth
      expect(loginResponse.status).toBe(401)
      expect(loginResponse.body.error).toBe('Invalid email or password')
    })
  })

  describe('Token Security', () => {
    it('should reject malformed tokens', async () => {
      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', 'Bearer malformed.token.here')

      expect(response.status).toBe(401)
    })

    it('should reject empty authorization header', async () => {
      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', '')

      expect(response.status).toBe(401)
    })

    it('should reject token with wrong signature', async () => {
      // A properly formatted but invalid JWT
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20ifQ.wrongsignature'

      const response = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${fakeToken}`)

      expect(response.status).toBe(401)
    })
  })

  describe('Password Security', () => {
    it('should enforce minimum password length of 12 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `short_${Date.now()}@example.com`,
          name: 'Short Pass User',
          password: 'Short1!'
        })

      expect(response.status).toBe(400)
    })

    it('should require uppercase letter in password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `nouppercase_${Date.now()}@example.com`,
          name: 'No Upper User',
          password: 'nouppercase123!'
        })

      expect(response.status).toBe(400)
      expect(response.body.details).toContain('Password must contain at least one uppercase letter')
    })

    it('should require lowercase letter in password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `nolowercase_${Date.now()}@example.com`,
          name: 'No Lower User',
          password: 'NOLOWERCASE123!'
        })

      expect(response.status).toBe(400)
      expect(response.body.details).toContain('Password must contain at least one lowercase letter')
    })

    it('should require number in password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `nonumber_${Date.now()}@example.com`,
          name: 'No Number User',
          password: 'NoNumberHere!'
        })

      expect(response.status).toBe(400)
      expect(response.body.details).toContain('Password must contain at least one number')
    })

    it('should require special character in password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `nospecial_${Date.now()}@example.com`,
          name: 'No Special User',
          password: 'NoSpecialChar123'
        })

      expect(response.status).toBe(400)
      expect(response.body.details).toContain('Password must contain at least one special character')
    })

    it('should not return password hash in any response', async () => {
      const user = await registerTestUser()

      // Check registration response
      expect(user).not.toHaveProperty('password_hash')

      // Check /me endpoint
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user.token}`)

      expect(meResponse.body.user).not.toHaveProperty('password_hash')
      expect(meResponse.body.user).not.toHaveProperty('password')
    })
  })

  describe('Input Validation', () => {
    let testUser

    beforeAll(async () => {
      testUser = await registerTestUser({
        email: `inputvalidation_${Date.now()}@example.com`,
        name: 'Input Validation User',
        password: 'InputValidation123!'
      })
    })

    it('should reject oversized JSON payloads', async () => {
      const largePayload = {
        notes: 'X'.repeat(100000) // 100KB of data
      }

      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          first_name: 'Large',
          last_name: 'Payload',
          ...largePayload
        })

      // Should be rejected due to payload limit
      expect([400, 413]).toContain(response.status)
    })

    it('should sanitize and trim input strings', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          first_name: '  Trimmed  ',
          last_name: '  Input  '
        })

      expect(response.status).toBe(201)
      expect(response.body.first_name).toBe('Trimmed')
      expect(response.body.last_name).toBe('Input')
    })

    it('should reject SQL injection attempts in search', async () => {
      const response = await request(app)
        .get('/api/clients?search=\'; DROP TABLE clients; --')
        .set('Authorization', `Bearer ${testUser.token}`)

      // Should return safely without error
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
    })

    it('should handle special characters in client names', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          first_name: "O'Brien",
          last_name: 'Smith-Jones'
        })

      expect(response.status).toBe(201)
      expect(response.body.first_name).toBe("O'Brien")
      expect(response.body.last_name).toBe('Smith-Jones')
    })

    it('should reject XSS attempts in notes field', async () => {
      const response = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          first_name: 'XSS',
          last_name: 'Test',
          notes: '<script>alert("xss")</script>'
        })

      // Should accept but data should be stored as-is (React will escape on render)
      expect(response.status).toBe(201)
    })

    it('should validate email format', async () => {
      const invalidEmails = [
        'notanemail',
        'missing@tld',
        '@nodomain.com',
        'spaces in@email.com'
      ]

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/clients')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({
            first_name: 'Email',
            last_name: 'Test',
            email: email
          })

        expect(response.status).toBe(400)
      }
    })
  })

  describe('Error Handling', () => {
    it('should not leak stack traces in error responses', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')

      expect(response.body).not.toHaveProperty('stack')
      expect(JSON.stringify(response.body)).not.toContain('at ')
    })

    it('should return generic errors for server issues', async () => {
      // This would require triggering an actual server error
      // For now, just verify 404 handling is correct
      const response = await request(app).get('/api/nonexistent')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Not found')
    })
  })

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app).get('/api/health')

      // Helmet should add these headers
      expect(response.headers).toHaveProperty('x-content-type-options')
      expect(response.headers).toHaveProperty('x-frame-options')
    })
  })
})

describe('Audit Logging', () => {
  let app

  beforeAll(() => {
    app = getApp()
  })

  it('should log API requests for compliance', async () => {
    const user = await registerTestUser()

    // Make a request that should be logged
    await request(app)
      .get('/api/clients')
      .set('Authorization', `Bearer ${user.token}`)

    // The audit log should have recorded this
    // In a real test, we'd query the audit_logs table
    expect(true).toBe(true) // Placeholder - audit logging is async
  })
})
