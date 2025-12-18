import { initializeDatabase } from './index.js'
import db from './index.js'

/**
 * Seed database with default data
 */
function seedDatabase() {
  console.log('Seeding database...')

  // Create default user
  const defaultUserExists = db.prepare('SELECT id FROM users WHERE id = ?').get('default')

  if (!defaultUserExists) {
    db.prepare(`
      INSERT INTO users (id, email, name)
      VALUES ('default', 'advisor@mutualmentor.com', 'Default Advisor')
    `).run()
    console.log('✓ Created default user')
  }

  // Seed 43 pipeline steps
  const existingSteps = db.prepare('SELECT COUNT(*) as count FROM pipeline_steps WHERE user_id = ?').get('default')

  if (existingSteps.count === 0) {
    const steps = [
      // Phase 1: Initial Contact (Steps 1-7)
      { step: 1, name: 'Call and schedule appointment', phase: 'Initial Contact' },
      { step: 2, name: 'Update CRM mobile', phase: 'Initial Contact' },
      { step: 3, name: 'Send invite to JW partner', phase: 'Initial Contact' },
      { step: 4, name: 'Share contact with JW in CRM', phase: 'Initial Contact' },
      { step: 5, name: 'Send confirmation email', phase: 'Initial Contact' },
      { step: 6, name: 'Schedule day-before confirmation call', phase: 'Initial Contact' },
      { step: 7, name: 'Text morning of reminder (with office instructions if in-person)', phase: 'Initial Contact' },

      // Phase 2: Discovery (Steps 8-16)
      { step: 8, name: 'Conduct Discovery meeting', phase: 'Discovery' },
      { step: 9, name: 'Update CRM mobile', phase: 'Discovery' },
      { step: 10, name: 'Send invite to JW partner', phase: 'Discovery' },
      { step: 11, name: 'Share referral contacts with JW partner', phase: 'Discovery' },
      { step: 12, name: 'Send follow-up email with checklist and Budget PDF', phase: 'Discovery' },
      { step: 13, name: 'Complete case notes', phase: 'Discovery' },
      { step: 14, name: 'Scan FF & move to SET folder', phase: 'Discovery' },
      { step: 15, name: 'Upload FF to Docket', phase: 'Discovery' },
      { step: 16, name: 'Update contact in CRM', phase: 'Discovery' },

      // Phase 3: Planning Prep (Steps 17-22)
      { step: 17, name: 'Create feedlist', phase: 'Planning Prep' },
      { step: 18, name: 'Create PX', phase: 'Planning Prep' },
      { step: 19, name: 'Create recommendation illustrations', phase: 'Planning Prep' },
      { step: 20, name: 'Print PX/illustrations if meeting in-person', phase: 'Planning Prep' },
      { step: 21, name: 'Schedule day-before confirmation call', phase: 'Planning Prep' },
      { step: 22, name: 'Text morning of reminder', phase: 'Planning Prep' },

      // Phase 4: Planning (Steps 23-30)
      { step: 23, name: 'Conduct Planning meeting', phase: 'Planning' },
      { step: 24, name: 'Update CRM mobile', phase: 'Planning' },
      { step: 25, name: 'Send invite to JW partner', phase: 'Planning' },
      { step: 26, name: 'Share referral contacts with JW partner', phase: 'Planning' },
      { step: 27, name: 'Send follow-up email', phase: 'Planning' },
      { step: 28, name: 'Complete case notes', phase: 'Planning' },
      { step: 29, name: 'Upload PX/illustrations to SET folder', phase: 'Planning' },
      { step: 30, name: 'Upload PX/illustrations to Docket', phase: 'Planning' },

      // Phase 5: Closing (Steps 31-35)
      { step: 31, name: 'Conduct Closing meeting', phase: 'Closing' },
      { step: 32, name: 'Update CRM mobile', phase: 'Closing' },
      { step: 33, name: 'Share referral contacts with JW partner', phase: 'Closing' },
      { step: 34, name: 'Send follow-up email', phase: 'Closing' },
      { step: 35, name: 'Complete case notes', phase: 'Closing' },

      // Phase 6: Application (Steps 36-43, includes Follow-up)
      { step: 36, name: 'Send CDC to SET', phase: 'Application' },
      { step: 37, name: 'Update contact in CRM', phase: 'Application' },
      { step: 38, name: 'Have client complete OMHQ', phase: 'Application' },
      { step: 39, name: 'Schedule nurse visit or saliva swab (if needed)', phase: 'Application' },
      { step: 40, name: 'Have client e-sign the application', phase: 'Application' },
      { step: 41, name: 'Have SET submit the application', phase: 'Application' },
      { step: 42, name: 'Notify client that the application has been submitted', phase: 'Application' },
      { step: 43, name: 'Schedule a follow-up in 3 months', phase: 'Application' },
    ]

    const insertStmt = db.prepare(`
      INSERT INTO pipeline_steps (user_id, step_number, name, phase)
      VALUES (?, ?, ?, ?)
    `)

    const insertMany = db.transaction((steps) => {
      for (const step of steps) {
        insertStmt.run('default', step.step, step.name, step.phase)
      }
    })

    insertMany(steps)
    console.log('✓ Seeded 43 pipeline steps')
  }

  // Seed default goals for all timeframes
  const DEFAULT_GOALS = {
    daily: { dials: 30, meetings_set: 3, kept_meetings: 2, closes: 1, lives: 2, points: 500 },
    weekly: { dials: 150, meetings_set: 15, kept_meetings: 12, closes: 3, lives: 6, points: 2500 },
    monthly: { dials: 600, meetings_set: 60, kept_meetings: 48, closes: 12, lives: 24, points: 10000 },
    quarterly: { dials: 1800, meetings_set: 180, kept_meetings: 144, closes: 36, lives: 72, points: 30000 },
    yearly: { dials: 7200, meetings_set: 720, kept_meetings: 576, closes: 144, lives: 288, points: 120000 }
  }

  const existingGoals = db.prepare('SELECT COUNT(*) as count FROM goals WHERE user_id = ?').get('default')

  if (existingGoals.count === 0) {
    const insertGoalStmt = db.prepare(`
      INSERT INTO goals (id, user_id, period_type, dials, meetings_set, kept_meetings, closes, lives, points)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const insertAllGoals = db.transaction(() => {
      for (const [periodType, goals] of Object.entries(DEFAULT_GOALS)) {
        const id = `goal_${periodType}_default`
        insertGoalStmt.run(
          id,
          'default',
          periodType,
          goals.dials,
          goals.meetings_set,
          goals.kept_meetings,
          goals.closes,
          goals.lives,
          goals.points
        )
      }
    })

    insertAllGoals()
    console.log('✓ Seeded default goals for all timeframes')
  }

  console.log('Database seeding completed!')
}

// Run initialization and seeding
initializeDatabase()
seedDatabase()

console.log('\n✅ Database ready!')
