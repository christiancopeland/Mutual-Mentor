/**
 * Jest Test Setup
 * Configures test environment before each test suite runs
 *
 * Note: Environment variables (NODE_ENV, DATABASE_PATH, JWT_SECRET, JWT_EXPIRATION)
 * are set via the npm test script using cross-env
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import { jest } from '@jest/globals'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Ensure data directory exists
const dataDir = join(__dirname, '../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Increase timeout for slower operations
jest.setTimeout(30000)
