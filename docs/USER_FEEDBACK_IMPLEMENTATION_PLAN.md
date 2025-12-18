# User Feedback Implementation Plan
## Northwestern Mutual Advisor CRM - Real-World User Feedback Analysis

**Feedback Date:** December 16, 2025
**Source:** Northwestern Mutual Financial Advisor (End User)
**Document Created:** December 16, 2025
**Priority:** HIGH - Direct user feedback from target audience

---

## Executive Summary

This document analyzes feedback from a Northwestern Mutual financial advisor who will be using the Mutual Mentor CRM. The feedback reveals critical UX issues, missing features, and areas where the current implementation doesn't match real-world workflow needs. This plan provides a prioritized roadmap for the next developer.

**Key Themes:**
1. Client Pipeline UX needs significant improvement
2. Granum Metrics tracking doesn't match real-world metrics used by advisors
3. Bonus/Challenge tracking UI needs redesign
4. Dashboard and Analytics pages don't provide actionable value
5. Time period tracking needs custom date ranges (fiscal quarters)

---

## Feedback Analysis & Implementation Plan

### 1. Client Pipeline Management Issues

#### Issue 1.1: Client Sorting by Last Name
**Feedback:** "Create ability to add clients in alphabetical order by last name on Client Pipeline"

**Analysis:**
- Currently clients are sorted by `created_at DESC` (newest first)
- Real advisors need alphabetical sorting by last name for quick lookup
- No last name field exists in current schema

**Implementation Priority:** HIGH (P0)

**Required Changes:**
- **Database Schema:**
  - Split `name` field into `first_name` and `last_name` in clients table
  - Add migration to parse existing names (handle edge cases)
  - Update all API endpoints to use new fields

- **Frontend:**
  - Update client forms to have separate first/last name inputs
  - Add sort dropdown: "Date Added (Newest)", "Last Name (A-Z)", "Last Name (Z-A)"
  - Default sort to alphabetical by last name
  - Update all displays to show "Last, First" format option

**Files to Modify:**
- `server/db/schema.sql` - Add first_name, last_name columns
- `server/routes/clients.js` - Update CREATE, UPDATE, GET endpoints
- `client/src/pages/Clients.jsx` - Add sort controls, update form
- `client/src/components/clients/*` - Update all client displays

**Estimated Effort:** 4-6 hours

---

#### Issue 1.2: Form Not Clearing After Add Client
**Feedback:** "After adding New Client, clicking to add another New Client should not still have former name inserted"

**Analysis:**
- Form state not being reset after successful client creation
- Common UX issue that frustrates rapid data entry

**Implementation Priority:** HIGH (P0)

**Required Changes:**
- Reset form state after successful POST
- Show success toast
- Keep modal open but with cleared form (option to close or add another)

**Files to Modify:**
- `client/src/pages/Clients.jsx` - Reset form after successful add
- Consider adding "Save & Add Another" button

**Estimated Effort:** 1 hour

---

#### Issue 1.3: Pipeline Dropdown Behavior
**Feedback:** "Upon adding client, menu should not be dropped down yet but allow (view pipeline) and then drop down each individual category based on place in pipeline"

**Analysis:**
- Current implementation shows full pipeline on client card
- User wants collapsed view by default with "View Pipeline" button
- Each phase should expand/collapse independently
- Follow-up should merge into Application Process

**Implementation Priority:** MEDIUM (P1)

**Required Changes:**
- Redesign client card to show collapsed pipeline initially
- Add "View Pipeline" button that expands accordion
- Group steps by phase with individual expand/collapse
- Merge "Follow-up" phase into "Application Process"

**Files to Modify:**
- `client/src/components/clients/ClientCard.jsx` (if exists) or create
- `client/src/pages/Clients.jsx` - Update client display component

**Estimated Effort:** 3-4 hours

---

#### Issue 1.4: Simplified Pipeline Filter Options
**Feedback:** "All Clients dropdown menu can be updated to: All Clients, Initial Contact, Discovery Meeting, Planning Prep, Planning Meeting, Closing Meeting, Application Process, Completed"

**Analysis:**
- Current 43-step pipeline is too granular for filtering
- User wants phase-level filtering (7 options total)
- This aligns with Northwestern Mutual's actual sales process stages

**Implementation Priority:** HIGH (P0)

**Required Changes:**
- Update filter dropdown to show phases instead of individual steps
- Map current 43 steps to 7 major phases:
  1. All Clients
  2. Initial Contact (steps 1-7)
  3. Discovery Meeting (steps 8-16)
  4. Planning Prep (steps 17-22)
  5. Planning Meeting (steps 23-30)
  6. Closing Meeting (steps 31-35)
  7. Application Process (steps 36-43, includes Follow-up)
  8. Completed (status filter)

**Files to Modify:**
- `client/src/pages/Clients.jsx` - Update filter logic
- `server/routes/clients.js` - May need endpoint updates for phase filtering

**Estimated Effort:** 2-3 hours

---

#### Issue 1.5: Automatic Status Updates
**Feedback:** "Edit Client: Status automatically updates to Planning Meeting if i.e. 6/6 steps completed for Planning Prep"

**Analysis:**
- User expects automatic phase progression when all steps in a phase are complete
- Current system requires manual step progression
- Need smart logic to detect phase completion and auto-advance

**Implementation Priority:** MEDIUM (P1)

**Required Changes:**
- Add server-side logic to detect when all steps in a phase are complete
- Automatically update `current_step` to first step of next phase
- Show notification: "Planning Prep completed! Moved to Planning Meeting"
- Consider adding undo/revert option

**Phase Completion Logic:**
```javascript
// Example pseudo-code
const phases = {
  'Initial Contact': { steps: [1, 7], nextPhase: 8 },
  'Discovery': { steps: [8, 16], nextPhase: 17 },
  'Planning Prep': { steps: [17, 22], nextPhase: 23 },
  // ... etc
}
```

**Files to Modify:**
- `server/routes/clients.js` - Add phase completion logic in UPDATE endpoint
- `client/src/pages/Clients.jsx` - Show transition notification

**Estimated Effort:** 3-4 hours

---

### 2. Bonus/Challenge System Redesign

#### Issue 2.1: Expanded Metric Types
**Feedback:** "Some bonuses/goals have multiple metric types, which are as follows: Lives, Clients, Premium, Closes, Plans, Referrals, Points, Fact Finders, Kept Meetings, Meetings Ahead, Dials"

**Analysis:**
- Current system has limited metric types: `dials, appointments, kept_appointments, closes, lives, points, clients, custom`
- Missing: Premium, Plans, Referrals, Fact Finders, Meetings Ahead
- User needs all these metric types for accurate bonus tracking

**Implementation Priority:** HIGH (P0)

**Required Changes:**
- **Database Schema:**
  ```sql
  -- Update bonuses metric_type CHECK constraint
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'dials', 'meetings_set', 'kept_meetings', 'closes',
    'plans', 'lives', 'clients', 'premium', 'referrals',
    'fact_finders', 'meetings_ahead', 'points', 'custom'
  ))
  ```

- Update granum_metrics table to track these new metrics
- Add fields to goals table

**Files to Modify:**
- `server/db/schema.sql` - Update CHECK constraints
- `server/routes/bonuses.js` - Support new metric types
- `client/src/pages/Dashboard.jsx` - Update bonus displays
- All bonus-related components

**Estimated Effort:** 4-5 hours

---

#### Issue 2.2: Custom Metric Input
**Feedback:** "Custom option in dropdown menu for Create Your First Bonus (which should probably say first challenge) should open textbox when selected"

**Analysis:**
- When user selects "Custom" metric type, need text input for custom metric name
- Rename "Bonus" to "Challenge" throughout the app (Northwestern Mutual terminology)

**Implementation Priority:** MEDIUM (P1)

**Required Changes:**
- Add conditional rendering: show text input when metric_type === 'custom'
- Add `custom_metric_name` field to bonuses table
- Global find/replace: "Bonus" → "Challenge"

**Files to Modify:**
- `server/db/schema.sql` - Add custom_metric_name column
- `server/routes/bonuses.js` - Handle custom metric names
- All bonus/challenge UI components - Update terminology
- `client/src/pages/Dashboard.jsx`, navigation, etc.

**Estimated Effort:** 2-3 hours

---

#### Issue 2.3: Challenge Card Redesign
**Feedback:** "Bonus Challenges view looks really sloppy. Perhaps it should be a hamburger instead of a hotdog."

**Analysis:**
- Current horizontal "hotdog" card layout is inefficient use of space
- User wants vertical "hamburger" stacked card layout
- Better for mobile and shows more challenges at once

**Implementation Priority:** MEDIUM (P1)

**Required Changes:**
- Redesign challenge cards to vertical layout
- Stack multiple challenges in a grid (2-3 columns on desktop, 1 on mobile)
- Improve visual hierarchy: metric type, target, progress bar, deadline
- Consider adding color coding by deadline proximity

**Example New Layout:**
```
┌─────────────────────┐
│ 🎯 25 Closes        │
│ ▓▓▓▓▓▓░░░░ 60%     │
│ 15/25 • 5 days left │
└─────────────────────┘
```

**Files to Modify:**
- `client/src/components/bonuses/*` or `client/src/pages/Dashboard.jsx`
- Create new `ChallengeCard.jsx` component

**Estimated Effort:** 3-4 hours

---

### 3. Granum Metrics Overhaul

#### Issue 3.1: Real-World Metrics List
**Feedback:** "Granum Metrics that are tracked on a daily, weekly, monthly, quarterly, and yearly basis are as follows: Days Worked, Meetings Made, Kept Meetings, Dials, Reached, Meetings Set, Meals, QS Obtained, QS Asked, New Seen, New Fact Finder, Case Opened, Joint Work, Plans, Closes, Points, Lives, Clients, Premium, Meetings Ahead (put in this order)"

**Analysis:**
- Current system only tracks: dials, appointments, kept_appointments, closes, lives, points
- Missing 14 critical metrics that advisors actually use
- Order matters for user workflow (listed in priority order)

**Implementation Priority:** CRITICAL (P0) - Core functionality mismatch

**Required Changes:**

**New Metrics Schema (19 metrics total in this order):**
1. Days Worked
2. Meetings Made
3. Kept Meetings (existing: kept_appointments)
4. Dials (existing)
5. Reached
6. Meetings Set
7. Meals
8. QS Obtained
9. QS Asked
10. New Seen
11. New Fact Finder
12. Case Opened
13. Joint Work
14. Plans
15. Closes (existing)
16. Points (existing)
17. Lives (existing)
18. Clients (existing)
19. Premium
20. Meetings Ahead

**Database Schema Update:**
```sql
CREATE TABLE IF NOT EXISTS granum_metrics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',

  -- Period identification
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Core metrics (in order)
  days_worked INTEGER DEFAULT 0,
  meetings_made INTEGER DEFAULT 0,
  kept_meetings INTEGER DEFAULT 0,
  dials INTEGER DEFAULT 0,
  reached INTEGER DEFAULT 0,
  meetings_set INTEGER DEFAULT 0,
  meals INTEGER DEFAULT 0,
  qs_obtained INTEGER DEFAULT 0,
  qs_asked INTEGER DEFAULT 0,
  new_seen INTEGER DEFAULT 0,
  new_fact_finder INTEGER DEFAULT 0,
  case_opened INTEGER DEFAULT 0,
  joint_work INTEGER DEFAULT 0,
  plans INTEGER DEFAULT 0,
  closes INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  lives INTEGER DEFAULT 0,
  clients INTEGER DEFAULT 0,
  premium INTEGER DEFAULT 0,
  meetings_ahead INTEGER DEFAULT 0,

  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, period_type, period_start)
);
```

**Files to Modify:**
- `server/db/schema.sql` - Complete schema overhaul
- `server/routes/metrics.js` - Update all CRUD operations
- `server/routes/goals.js` - Update to match new metrics
- `server/routes/analytics.js` - Update performance tracking
- `client/src/pages/GranumMetrics.jsx` - Complete UI redesign
- `client/src/hooks/useMetrics.js` - Update data structure

**Estimated Effort:** 12-16 hours (largest change)

---

#### Issue 3.2: Input UX Issues
**Feedback:** '"-" + signs before and after number does not make sense. but input that is saved via Enter in text box.'

**Analysis:**
- Current increment/decrement buttons (+/-) are confusing
- User wants simple text input with Enter to save
- More natural for rapid data entry

**Implementation Priority:** HIGH (P0)

**Required Changes:**
- Replace +/- buttons with editable number inputs
- Save on Enter key or blur
- Show subtle success indicator (checkmark, brief highlight)
- Allow tab navigation between metrics

**Files to Modify:**
- `client/src/pages/GranumMetrics.jsx` - Replace button controls with inputs

**Estimated Effort:** 2-3 hours

---

#### Issue 3.3: Cumulative Period Display
**Feedback:** "Clicking Daily, Weekly, or Monthly, etc should show progressive numbers in next tab (currently shows zero)"

**Analysis:**
- When switching from Daily → Weekly view, weekly total should show sum of daily entries
- Same for Monthly (sum of weeks), Quarterly (sum of months), Yearly (sum of quarters)
- Currently showing zeros because we're only looking for exact period matches

**Implementation Priority:** HIGH (P0)

**Required Changes:**
- Add aggregation logic to calculate period totals from smaller periods
- API endpoint: `GET /api/metrics/aggregated?period=weekly&start=2025-09-22`
- Frontend: Show both entered value + calculated aggregate in parentheses

**Example Display:**
```
Weekly Total (Week of Dec 8-14):
Dials: 45 (calculated from daily: 5+8+12+7+8+3+2)
```

**Files to Modify:**
- `server/routes/metrics.js` - Add aggregation endpoints
- `client/src/pages/GranumMetrics.jsx` - Display aggregated values

**Estimated Effort:** 4-5 hours

---

#### Issue 3.4: Goal Input Showing Zero
**Feedback:** "editing goal shows 0 before number instead of deleting zero for some reason"

**Analysis:**
- Input field defaulting to "0" placeholder instead of empty
- Should clear on focus or use empty placeholder

**Implementation Priority:** LOW (P2)

**Required Changes:**
- Update input to `placeholder="0"` with `defaultValue=""` instead of `value={0}`
- Select all text on focus

**Files to Modify:**
- `client/src/pages/GranumMetrics.jsx` - Update goal inputs

**Estimated Effort:** 30 minutes

---

#### Issue 3.5: Custom Date Ranges / Fiscal Quarters
**Feedback:** "time tracking is important via specific dates (i.e. I started September 22nd of this year and Q1 ends December 21st of this year)"

**Analysis:**
- Northwestern Mutual uses fiscal quarters, not calendar quarters
- User's Q1: Sept 22 - Dec 21 (91 days, not standard calendar quarter)
- Need custom date range support for quarters and years

**Implementation Priority:** HIGH (P0)

**Required Changes:**
- Add user settings for fiscal year start date
- Add custom date range picker for ad-hoc reporting
- Update quarter calculations to use fiscal quarters
- Allow "naming" of periods (e.g., "Q1 FY2025")

**New Feature: Settings Page**
```javascript
{
  fiscal_year_start: "2025-09-22",
  quarter_length: 91, // days, or calculate from start dates
  quarters: [
    { name: "Q1", start: "2025-09-22", end: "2025-12-21" },
    { name: "Q2", start: "2025-12-22", end: "2026-03-22" },
    // ...
  ]
}
```

**Files to Create:**
- `client/src/pages/Settings.jsx` - New settings page
- `server/routes/settings.js` - User preferences API

**Files to Modify:**
- `client/src/pages/GranumMetrics.jsx` - Use fiscal periods
- Date calculation utilities throughout

**Estimated Effort:** 8-10 hours

---

### 4. Dashboard Redesign

#### Issue 4.1: Dashboard as "Need-to-Do" Hub
**Feedback:** "I will have to think about what the dashboard should look like but just know I am not a fan of it and think it should probably be more like a 'need-to-do' quick access point"

**Analysis:**
- Current dashboard shows summary stats and charts
- User wants action-oriented dashboard (task list, upcoming deadlines)
- Think: "What do I need to do TODAY?"

**Implementation Priority:** HIGH (P0)

**Recommended New Dashboard Layout:**

1. **Today's Priorities** (Top Section)
   - Clients with next_action_due = today
   - Challenges expiring in next 7 days
   - Daily metrics not yet logged

2. **Quick Actions** (Middle Section)
   - Add New Client (quick form)
   - Log Today's Metrics (inline quick entry)
   - Update Client Status (recent clients list)

3. **This Week** (Bottom Section)
   - Weekly goal progress bars
   - Upcoming appointments/meetings
   - Clients in each pipeline phase (summary)

4. **Move Current Charts to Analytics**
   - Pipeline distribution → Analytics page
   - Performance trends → Analytics page

**Files to Modify:**
- `client/src/pages/Dashboard.jsx` - Complete redesign
- Create new components:
  - `TodaysPriorities.jsx`
  - `QuickActions.jsx`
  - `WeeklySummary.jsx`

**Estimated Effort:** 10-12 hours

---

### 5. Analytics Page Improvements

#### Issue 5.1: Analytics Value Unclear
**Feedback:** "Same thing with Analytics tab: I am unsure what to expect there but it currently does not show numerical value or make sense in the functions that would be expected of an Analytics log/tracker"

**Analysis:**
- Current analytics show charts without clear numerical context
- Missing key performance indicators (KPIs)
- Need to show trends, ratios, and benchmarks

**Implementation Priority:** MEDIUM (P1)

**Recommended Analytics Structure:**

1. **Key Performance Indicators (Top Cards)**
   - Conversion Rate: Closes / Kept Meetings (show as percentage)
   - Activity Ratio: Dials / Reaches (show as percentage)
   - Meeting Efficiency: Kept Meetings / Meetings Set
   - Pipeline Velocity: Avg days from Initial Contact → Close

2. **Performance vs. Goals**
   - Table showing each metric vs. goal
   - Color coding: Green (>100%), Yellow (80-100%), Red (<80%)
   - Show numerical values prominently

3. **Trend Analysis**
   - Week-over-week growth percentages
   - Month-over-month comparisons
   - Best performing weeks/months highlighted

4. **Charts (Keep but Enhance)**
   - Add data labels to chart points
   - Show exact numbers on hover
   - Add trendline option

**Files to Modify:**
- `client/src/pages/Analytics.jsx` - Add KPI cards, numerical displays
- `server/routes/analytics.js` - Add KPI calculation endpoints

**Estimated Effort:** 6-8 hours

---

## Implementation Priorities

### Phase 1: Critical Fixes (P0) - Do First
**Estimated Total: 35-45 hours**

1. **Granum Metrics Overhaul** (12-16h)
   - Add all 20 metrics to schema
   - Update all metrics endpoints
   - Redesign metrics UI
   - Fix input UX (remove +/- buttons)

2. **Client Last Name Sorting** (4-6h)
   - Split name field
   - Add sort controls
   - Update all client displays

3. **Pipeline Filter Simplification** (2-3h)
   - Update filter to phase-level

4. **Form Reset After Add** (1h)
   - Clear form after successful add

5. **Expanded Bonus Metric Types** (4-5h)
   - Add new metric types to schema
   - Update bonus creation

6. **Metrics Input Fix** (2-3h)
   - Replace +/- with text inputs

7. **Period Aggregation** (4-5h)
   - Calculate weekly/monthly/quarterly totals

8. **Custom Date Ranges** (8-10h)
   - Add fiscal quarter support
   - Settings page for date configuration

9. **Dashboard Redesign** (10-12h)
   - Redesign as "need-to-do" hub
   - Add quick actions

### Phase 2: Important Improvements (P1) - Do Next
**Estimated Total: 15-20 hours**

1. **Pipeline Dropdown Behavior** (3-4h)
   - Collapsed pipeline with expand

2. **Auto Status Updates** (3-4h)
   - Phase completion detection

3. **Custom Metric Input** (2-3h)
   - Text input for custom metrics
   - Rename to "Challenges"

4. **Challenge Card Redesign** (3-4h)
   - Vertical card layout

5. **Analytics Improvements** (6-8h)
   - Add KPIs and numerical displays

### Phase 3: Polish (P2) - Do Last
**Estimated Total: 1 hour**

1. **Goal Input Zero Fix** (30min)
   - Fix placeholder behavior

---

## Technical Considerations

### Database Migrations
This feedback requires several schema changes. Recommend:

1. Create migration system (if not exists)
2. Write migration scripts for:
   - Adding first_name/last_name columns
   - Expanding granum_metrics columns
   - Adding custom_metric_name to bonuses
   - Updating CHECK constraints

3. Data migration strategy:
   - Parse existing names → first/last (handle "John Doe", "Doe, John", single names)
   - Preserve existing data in new schema

### Backward Compatibility
- Consider versioning API if this is in production
- Add feature flags for gradual rollout
- Provide data export before major schema changes

### Testing Priorities
Focus testing on:
1. Name parsing/migration accuracy
2. Metric aggregation calculations
3. Phase completion logic
4. Fiscal quarter calculations

---

## Next Steps for Developer

1. **Review this plan with stakeholder** - Get confirmation on priorities
2. **Set up development branch** - `feature/user-feedback-implementation`
3. **Start with Phase 1** - Critical fixes first
4. **Test with real data** - Use advisor's actual client/metric data if available
5. **Get feedback early** - Show progress after each major feature
6. **Document changes** - Update API docs and user guide

---

## Questions for Stakeholder/User

Before implementation, clarify:

1. **Fiscal Quarter Dates** - Confirm all 4 quarter date ranges
2. **Metric Definitions** - What exactly is "QS Obtained" vs "QS Asked"? (Quality Something?)
3. **Premium Metric** - Is this dollar amount or count? (probably dollars, need decimal support)
4. **Dashboard Priorities** - What tasks are MOST important to see first?
5. **Analytics KPIs** - Which ratios/benchmarks matter most to advisors?
6. **Data Migration** - Can we test with a copy of real data?

---

## Risk Assessment

**High Risk:**
- Granum metrics schema change (affects entire app)
- Name field splitting (data loss risk)
- Fiscal quarter calculation errors

**Medium Risk:**
- Dashboard redesign (subjective, may need iterations)
- Phase auto-completion (could cause unexpected client moves)

**Low Risk:**
- UI tweaks (challenge cards, input styles)
- Filter updates
- Form reset behavior

---

*Document prepared by Claude Code*
*Based on direct user feedback from Northwestern Mutual Financial Advisor*
*All time estimates are for experienced developer familiar with the codebase*
