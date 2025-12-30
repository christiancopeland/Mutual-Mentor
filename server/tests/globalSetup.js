/**
 * Jest Global Setup
 * Runs BEFORE any test suites or modules are loaded
 * Sets up environment variables for the test database
 */

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default async function globalSetup() {
  // Create a unique test database path using timestamp
  const testRunId = Date.now()
  const testDbPath = join(__dirname, `../data/test-crm-${testRunId}.db`)

  // Ensure data directory exists
  const dataDir = join(__dirname, '../data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  // Store the database path in environment for tests to use
  process.env.DATABASE_PATH = testDbPath
  process.env.TEST_DB_PATH = testDbPath
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-do-not-use-in-production'
  process.env.JWT_EXPIRATION = '1h'

  // Clean up old test databases (older than 1 hour)
  try {
    const files = fs.readdirSync(dataDir)
    const oneHourAgo = Date.now() - (60 * 60 * 1000)

    files.forEach(file => {
      if (file.startsWith('test-crm-') && file.endsWith('.db')) {
        const match = file.match(/test-crm-(\d+)\.db/)
        if (match) {
          const fileTime = parseInt(match[1], 10)
          if (fileTime < oneHourAgo) {
            try {
              fs.unlinkSync(join(dataDir, file))
            } catch (e) {
              // Ignore errors (file may be in use)
            }
          }
        }
      }
    })
  } catch (e) {
    // Ignore cleanup errors
  }

  console.log(`Test database: ${testDbPath}`)
}
