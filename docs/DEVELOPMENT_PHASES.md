# Development Phases
# Northwestern Mutual Advisor CRM

**Version:** 1.0
**Date:** December 15, 2025
**Status:** Active

---

## Overview

This document outlines the phased development approach for building the Northwestern Mutual Advisor CRM. The project is broken down into 3 focused phases to ensure incremental progress and digestible milestones.

---

## Phase 1: Foundation & Client Pipeline (Weeks 1-2)

### Goal
Establish the core infrastructure and deliver a fully functional Client Pipeline Tracker that allows advisors to add clients and track them through the 43-step NM sales process.

### Deliverables

#### 1.1 Project Scaffolding
- [x] Create monorepo structure with `/client` and `/server` directories
- [ ] Initialize React + Vite frontend
- [ ] Initialize Node.js + Express backend
- [ ] Configure Tailwind CSS
- [ ] Set up React Router
- [ ] Install all dependencies from tech spec

#### 1.2 Database Setup
- [ ] Configure better-sqlite3
- [ ] Create database schema:
  - `users` table (basic, single-user mode)
  - `clients` table
  - `pipeline_steps` table
- [ ] Seed 43 default pipeline steps with phases
- [ ] Create database initialization script

#### 1.3 Backend API - Clients
- [ ] `GET /api/clients` - List all clients with filters
- [ ] `GET /api/clients/:id` - Get single client
- [ ] `POST /api/clients` - Create new client
- [ ] `PUT /api/clients/:id` - Update client
- [ ] `DELETE /api/clients/:id` - Delete client
- [ ] `POST /api/clients/:id/steps/:stepNumber/complete` - Mark step complete
- [ ] `POST /api/clients/:id/steps/:stepNumber/uncomplete` - Mark step incomplete
- [ ] `GET /api/clients/pipeline/steps` - Get all pipeline steps

#### 1.4 Frontend Layout & Navigation
- [ ] Create `Layout` component with sidebar
- [ ] Create `Header` component
- [ ] Create `Sidebar` component with navigation
- [ ] Set up routing for:
  - `/` - Dashboard (placeholder)
  - `/clients` - Clients page
  - `/metrics` - Granum Metrics (placeholder)

#### 1.5 Client Pipeline Components
- [ ] `ClientCard.jsx` - Display client with progress bar and pipeline
- [ ] `PipelineChecklist.jsx` - 43 steps with 7 color-coded phases
- [ ] `ClientForm.jsx` - Modal form for create/edit
- [ ] Shared UI components:
  - `Modal.jsx`
  - `Button.jsx`
  - `Input.jsx`
  - `Badge.jsx`
  - `ProgressBar.jsx`

#### 1.6 Clients Page
- [ ] Client statistics cards (Active, Completed, Stalled counts)
- [ ] Search bar for filtering by name
- [ ] Status filter dropdown
- [ ] Client list with `ClientCard` components
- [ ] Create client button + modal
- [ ] Delete client functionality with confirmation

#### 1.7 Custom Hooks
- [ ] `useClients.js` - Client data management hook

### Success Criteria
- ✅ Can create a new client with name, phone, email, JW partner, referral source
- ✅ Can view all clients in a list with visual progress indicators
- ✅ Can expand a client to see full 43-step checklist organized by 7 phases
- ✅ Can check/uncheck steps and see progress update in real-time
- ✅ Can mark clients as active/stalled/completed/lost
- ✅ Can search and filter clients
- ✅ Can edit and delete clients
- ✅ Database persists all data correctly

---

## Phase 2: Granum Metrics & Dashboard (Weeks 2-3)

### Goal
Implement complete Granum Metrics tracking with goals, bonus tracking, and a comprehensive dashboard to provide advisors with real-time visibility into their performance.

### Deliverables

#### 2.1 Database Expansion
- [x] Create `granum_metrics` table
- [x] Create `goals` table
- [x] Create `bonuses` table
- [x] Create `metric_entries` table
- [x] Seed default goals for all timeframes

#### 2.2 Backend API - Metrics
- [x] `GET /api/metrics` - Get metrics for specific period
- [x] `PUT /api/metrics` - Update/upsert metrics
- [x] `POST /api/metrics/entry` - Log single metric entry
- [x] `GET /api/metrics/summary` - Summary across all timeframes

#### 2.3 Backend API - Goals
- [x] `GET /api/goals` - Get all goals
- [x] `PUT /api/goals/:periodType` - Update goals for period

#### 2.4 Backend API - Bonuses
- [x] `GET /api/bonuses` - List all bonuses
- [x] `POST /api/bonuses` - Create new bonus
- [x] `PUT /api/bonuses/:id` - Update bonus
- [x] `DELETE /api/bonuses/:id` - Delete/archive bonus
- [x] `PUT /api/bonuses/:id/progress` - Update bonus progress

#### 2.5 Granum Metrics Components
- [x] `MetricCard.jsx` - Individual metric display with progress
- [x] `BonusCard.jsx` - Bonus tracking card
- [x] `TimeframeTabs.jsx` - Tab switcher for timeframes

#### 2.6 Granum Metrics Page
- [x] Summary cards (Total Clients, GUT Ratio, Points, Active Bonuses)
- [x] Timeframe tab navigation (Daily/Weekly/Monthly/Quarterly/Yearly)
- [x] 6 metric cards with goals:
  - Dials
  - Appointments
  - Kept Appointments
  - Closes
  - Lives
  - Points
- [x] Inline goal editing
- [x] Progress bars with color coding (red/yellow/green)
- [x] Bonus section with create/edit/delete
- [x] Bonus progress tracking
- [x] Days remaining calculation

#### 2.7 Dashboard Page
- [x] Total Clients card (with JW split calculation)
- [x] GUT Ratio card
- [x] Current Points card
- [x] Active Bonuses count card
- [x] Quick navigation links
- [ ] Recent activity summary (optional - skipped)

#### 2.8 Custom Hooks
- [x] `useMetrics.js` - Metrics data management
- [x] `useBonuses.js` - Bonus data management

#### 2.9 Business Logic Implementation
- [x] Period date calculation (daily/weekly/monthly/quarterly/yearly)
- [x] GUT Ratio calculation
- [x] JW client split (0.5x) calculation
- [x] Progress percentage calculation
- [x] Progress status (on_track/close/behind)
- [x] Bonus days remaining calculation

### Success Criteria
- ✅ Can set goals for each metric across all 5 timeframes
- ✅ Can update actual metric values and see real-time progress
- ✅ Progress bars show correct color coding based on percentage
- ✅ Can create custom bonuses with targets and deadlines
- ✅ Bonus cards show progress percentage and days remaining
- ✅ GUT Ratio calculates correctly (closes / kept appointments × 100)
- ✅ JW clients count as 0.5 toward total client count
- ✅ Dashboard displays accurate summary across all metrics
- ✅ Can switch between timeframes and see correct data

---

## Phase 3: Polish & Enhancement (Week 4)

### Goal
Refine the application for production readiness with mobile responsiveness, data management features, user experience improvements, and performance optimizations.

### Deliverables

#### 3.1 Mobile Responsiveness
- [ ] Audit all pages on mobile viewports
- [ ] Optimize sidebar for mobile (hamburger menu)
- [ ] Ensure touch-friendly interactions
- [ ] Test on iOS and Android browsers
- [ ] Responsive tables and cards

#### 3.2 Data Management
- [ ] CSV export for clients
- [ ] CSV export for metrics
- [ ] Database backup functionality
- [ ] Data import capability (optional)
- [ ] Local storage fallback for critical data

#### 3.3 User Experience Enhancements
- [ ] Onboarding flow for first-time users
- [ ] Tooltips and help text
- [ ] Loading states for all async operations
- [ ] Error handling and user feedback
- [ ] Success/confirmation messages
- [ ] Keyboard shortcuts (optional)
- [ ] Dark mode support (optional)

#### 3.4 Analytics & Insights
- [ ] `GET /api/analytics/pipeline` - Pipeline analytics
- [ ] `GET /api/analytics/performance` - Performance trends
- [ ] Pipeline phase distribution chart
- [ ] Metric trends over time
- [ ] Completion time tracking

#### 3.5 Performance Optimization
- [ ] Code splitting with React.lazy
- [ ] Optimize database queries (indexes)
- [ ] Implement pagination for large client lists
- [ ] Debounce search inputs
- [ ] Optimize re-renders with React.memo

#### 3.6 Testing & Quality Assurance
- [ ] Unit tests for business logic
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical user flows
- [ ] Browser compatibility testing
- [ ] Performance benchmarking

#### 3.7 Documentation & Deployment
- [ ] User guide / documentation
- [ ] API documentation
- [ ] Environment setup guide
- [ ] Deployment scripts
- [ ] Docker configuration (optional)
- [ ] README with installation instructions

#### 3.8 Bug Fixes & Refinements
- [ ] Address any bugs discovered during testing
- [ ] UI polish and consistency
- [ ] Accessibility improvements (ARIA labels, keyboard nav)
- [ ] Form validation improvements
- [ ] Edge case handling

### Success Criteria
- ✅ Application works seamlessly on mobile devices
- ✅ Users can export their data to CSV
- ✅ First-time users understand how to use the app
- ✅ All API calls have proper error handling
- ✅ Application loads quickly with optimized assets
- ✅ Analytics provide meaningful insights
- ✅ Comprehensive test coverage for critical features
- ✅ Deployment process is documented and repeatable

---

## Future Enhancements (Phase 4+)

These features are planned for post-MVP releases:

### Phase 4: Authentication & Multi-User (Months 4-6)
- User registration and login
- Password reset functionality
- User profile management
- Data isolation per user
- JWT-based authentication
- Session management

### Phase 5: Collaboration & Teams
- Team/manager dashboards
- Aggregate team metrics
- Coaching insights
- JW partner collaboration features
- Shared client visibility

### Phase 6: Advanced Features
- Calendar integration
- Email integration
- SMS reminders
- Mobile native apps (iOS/Android)
- Push notifications
- Cloud sync across devices
- Advanced reporting and analytics
- Custom fields and workflows

---

## Development Guidelines

### Git Workflow
- Create feature branches for each major deliverable
- Use conventional commits (feat:, fix:, docs:, etc.)
- PR reviews before merging to main
- Tag releases at end of each phase

### Code Standards
- ESLint + Prettier for consistent formatting
- JSDoc comments for all functions
- Component-driven development
- Reusable utility functions
- DRY principles

### Testing Strategy
- Write tests alongside features (not after)
- Aim for 80%+ coverage on business logic
- E2E tests for critical user journeys
- Manual QA at end of each phase

---

## Timeline Summary

| Phase | Duration | Key Milestone |
|-------|----------|---------------|
| Phase 1 | Weeks 1-2 | Client Pipeline fully functional |
| Phase 2 | Weeks 2-3 | Complete metrics tracking |
| Phase 3 | Week 4 | Production-ready MVP |
| **Total** | **4 weeks** | **Full MVP launch** |

---

## Current Status

**Phase 1: Foundation & Client Pipeline**
- Status: ✅ **COMPLETE**
- Started: December 15, 2025
- Completed: December 15, 2025
- All deliverables implemented and tested successfully

**Phase 2: Granum Metrics & Dashboard**
- Status: ✅ **COMPLETE**
- Started: December 15, 2025
- Completed: December 16, 2025
- All deliverables implemented and tested successfully
- See [PHASE_2_PROGRESS.md](PHASE_2_PROGRESS.md) for details

**Next Up: Phase 3 - Polish & Enhancement**
- Status: Ready to Start
- Estimated Duration: 1 week

---

*Document maintained by: Development Team*
*Last updated: December 15, 2025*
