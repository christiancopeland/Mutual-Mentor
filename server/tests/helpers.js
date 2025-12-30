/**
 * Test Helpers
 * Utility functions for testing
 */

import request from 'supertest'
import { createTestApp } from './testApp.js'

// Create a shared app instance for tests
let app = null

/**
 * Get the test app instance (creates one if doesn't exist)
 */
export function getApp() {
  if (!app) {
    app = createTestApp()
  }
  return app
}

/**
 * Reset the app instance (useful for isolation)
 */
export function resetApp() {
  app = createTestApp()
  return app
}

/**
 * Register a test user and return credentials
 */
export async function registerTestUser(userData = {}) {
  const defaultUser = {
    email: `testuser_${Date.now()}@example.com`,
    name: 'Test User',
    password: 'SecureTestPass123!'
  }

  const user = { ...defaultUser, ...userData }
  const testApp = getApp()

  const response = await request(testApp)
    .post('/api/auth/register')
    .send(user)

  if (response.status !== 201) {
    throw new Error(`Failed to register test user: ${JSON.stringify(response.body)}`)
  }

  return {
    ...user,
    id: response.body.user.id,
    token: response.body.token
  }
}

/**
 * Login a test user and return token
 */
export async function loginTestUser(email, password) {
  const testApp = getApp()

  const response = await request(testApp)
    .post('/api/auth/login')
    .send({ email, password })

  if (response.status !== 200) {
    throw new Error(`Failed to login test user: ${JSON.stringify(response.body)}`)
  }

  return response.body.token
}

/**
 * Create a test client for a user
 */
export async function createTestClient(token, clientData = {}) {
  const defaultClient = {
    first_name: 'John',
    last_name: 'Doe',
    phone: '(555) 123-4567',
    email: 'john.doe@example.com',
    referral_source: 'Website',
    notes: 'Test client'
  }

  const client = { ...defaultClient, ...clientData }
  const testApp = getApp()

  const response = await request(testApp)
    .post('/api/clients')
    .set('Authorization', `Bearer ${token}`)
    .send(client)

  if (response.status !== 201) {
    throw new Error(`Failed to create test client: ${JSON.stringify(response.body)}`)
  }

  return response.body
}

/**
 * Create a test bonus for a user
 */
export async function createTestBonus(token, bonusData = {}) {
  const today = new Date()
  const nextMonth = new Date(today)
  nextMonth.setMonth(nextMonth.getMonth() + 1)

  const defaultBonus = {
    name: 'Test Bonus',
    description: 'A test bonus challenge',
    metric_type: 'dials',
    target_value: 100,
    start_date: today.toISOString().split('T')[0],
    deadline: nextMonth.toISOString().split('T')[0]
  }

  const bonus = { ...defaultBonus, ...bonusData }
  const testApp = getApp()

  const response = await request(testApp)
    .post('/api/bonuses')
    .set('Authorization', `Bearer ${token}`)
    .send(bonus)

  if (response.status !== 201) {
    throw new Error(`Failed to create test bonus: ${JSON.stringify(response.body)}`)
  }

  return response.body
}

/**
 * Make an authenticated request
 */
export function authRequest(method, path, token) {
  const testApp = getApp()
  return request(testApp)[method](path).set('Authorization', `Bearer ${token}`)
}

/**
 * Make an unauthenticated request
 */
export function publicRequest(method, path) {
  const testApp = getApp()
  return request(testApp)[method](path)
}

export default {
  getApp,
  resetApp,
  registerTestUser,
  loginTestUser,
  createTestClient,
  createTestBonus,
  authRequest,
  publicRequest
}
