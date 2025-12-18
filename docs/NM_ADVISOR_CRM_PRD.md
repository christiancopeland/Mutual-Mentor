# Product Requirements Document (PRD)
# Northwestern Mutual Advisor CRM
## Client Pipeline & Granum Metric Tracker

**Version:** 1.0
**Date:** December 15, 2025
**Status:** Draft

---

## Executive Summary

This document outlines the requirements for a standalone CRM application designed specifically for Northwestern Mutual financial advisors. The application extracts and enhances two core features from the Holistix Remedy platform:

1. **Client Pipeline Tracker** - A 43-step sales process management system
2. **Granum Metric Tracker** - Activity and goal tracking across multiple timeframes with bonus tracking

The product aims to reduce friction in daily client work management and provide comprehensive metrics tracking to help advisors meet their daily, weekly, monthly, quarterly, and yearly goals—as well as track progress toward custom bonuses.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Target Users](#2-target-users)
3. [Product Vision](#3-product-vision)
4. [Features & Requirements](#4-features--requirements)
5. [User Stories](#5-user-stories)
6. [Success Metrics](#6-success-metrics)
7. [Constraints & Assumptions](#7-constraints--assumptions)
8. [Timeline & Phases](#8-timeline--phases)

---

## 1. Problem Statement

### Current Pain Points for NM Financial Advisors

1. **Fragmented Process Tracking**: Advisors struggle to consistently follow the 43-step NM sales process across multiple clients, leading to missed steps and lost opportunities.

2. **Manual Metric Tracking**: Calculating daily/weekly/monthly activity metrics (dials, appointments, closes, etc.) is tedious and error-prone.

3. **Goal Visibility**: No centralized view of progress toward various timeframe goals (daily → yearly).

4. **Bonus Tracking Complexity**: Custom bonuses with different targets (closes, points, lives) and deadlines are difficult to track manually.

5. **JW Partner Attribution**: Joint Work (JW) splits require manual calculation for accurate personal metric tracking.

6. **CRM Duplication**: Existing corporate CRM systems are not optimized for the specific NM sales process workflow.

### Opportunity

A purpose-built, lightweight CRM that integrates the NM 43-step process with real-time metric tracking will:
- Increase advisor productivity by 20-30%
- Improve sales process adherence
- Provide clear visibility into goal attainment
- Reduce administrative overhead

---

## 2. Target Users

### Primary Persona: Northwestern Mutual Financial Advisor

**Demographics:**
- Age: 25-55
- Tech comfort: Moderate to high
- Device usage: Desktop (primary), mobile (secondary)

**Characteristics:**
- Manages 20-100+ active prospects/clients
- Works toward multiple simultaneous goals and bonuses
- Often collaborates with Joint Work (JW) partners
- Needs quick data entry during or between meetings
- Values simplicity over feature complexity

**Key Needs:**
- Know exactly where each client is in the sales process
- Track daily activity without manual spreadsheets
- See at-a-glance progress toward all goals
- Never miss a bonus deadline

### Secondary Persona: Team Lead / Managing Director

**Needs:**
- Aggregate view of team metrics (future phase)
- Coaching insights based on pipeline data
- Accountability tracking

---

## 3. Product Vision

### Vision Statement

> "The essential daily companion for Northwestern Mutual advisors—streamlining client management and putting goal achievement at your fingertips."

### Core Principles

1. **Simplicity First**: Every feature must reduce friction, not add it
2. **NM-Native**: Built specifically for the NM sales process and terminology
3. **Goal-Centric**: Always show progress toward what matters
4. **Speed**: Data entry in seconds, not minutes
5. **Offline-Capable**: Works without constant internet (local-first architecture)

### Differentiation from Existing Solutions

| Aspect | Corporate CRM | This Solution |
|--------|--------------|---------------|
| Sales Process | Generic | NM 43-step native |
| Goal Tracking | Limited | Multi-timeframe + bonuses |
| JW Attribution | Manual | Automatic 0.5x split |
| Granum Metrics | External | Built-in |
| Setup Time | Weeks | Minutes |

---

## 4. Features & Requirements

### 4.1 Client Pipeline Tracker

#### 4.1.1 Client Management

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| CPT-001 | Create new client with basic info (name, phone, email) | P0 | Required fields: name only |
| CPT-002 | Track referral source for each client | P1 | Free text field |
| CPT-003 | Assign JW (Joint Work) partner to client | P0 | Affects metric attribution |
| CPT-004 | Add notes per client | P1 | Free text, no limit |
| CPT-005 | Set client status (active, stalled, completed, lost) | P0 | Status workflow |
| CPT-006 | Track referral contacts received from client | P2 | JSON array storage |
| CPT-007 | Search clients by name | P0 | Debounced search |
| CPT-008 | Filter clients by status | P0 | Dropdown filter |
| CPT-009 | Edit existing client information | P0 | Full CRUD |
| CPT-010 | Delete client with confirmation | P1 | Soft delete option (P2) |

#### 4.1.2 Pipeline Process (43 Steps)

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| CPT-020 | Display 43-step NM sales process | P0 | Grouped by 7 phases |
| CPT-021 | Mark steps as complete/incomplete | P0 | Toggle interaction |
| CPT-022 | Visual progress indicator per client | P0 | Progress bar |
| CPT-023 | Visual progress indicator per phase | P1 | Phase-level aggregation |
| CPT-024 | Auto-advance current step on completion | P1 | currentStep = max(completed) + 1 |
| CPT-025 | Auto-complete client when all 43 steps done | P0 | Status → completed |
| CPT-026 | Color-coded phases | P1 | 7 distinct colors |
| CPT-027 | Collapsible phase sections | P1 | Default: expanded |
| CPT-028 | Show phase completion badge | P2 | "Complete" indicator |

**The 7 Phases:**
1. Initial Contact (Steps 1-7)
2. Discovery (Steps 8-16)
3. Planning Prep (Steps 17-22)
4. Planning (Steps 23-30)
5. Closing (Steps 31-35)
6. Application (Steps 36-42)
7. Follow-up (Step 43)

#### 4.1.3 Dashboard Statistics

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| CPT-030 | Display count of active clients | P0 | Real-time |
| CPT-031 | Display count of completed clients | P0 | |
| CPT-032 | Display count of stalled clients | P0 | |
| CPT-033 | Display total steps completed (all clients) | P1 | |
| CPT-034 | Show current phase badge per client | P1 | In list view |

---

### 4.2 Granum Metric Tracker

#### 4.2.1 Activity Metrics

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| GMT-001 | Track Dials (phone calls made) | P0 | Integer counter |
| GMT-002 | Track Appointments (meetings scheduled) | P0 | |
| GMT-003 | Track Kept Appointments (meetings completed) | P0 | |
| GMT-004 | Track Closes (deals closed) | P0 | Key metric |
| GMT-005 | Track Lives (lives covered) | P0 | |
| GMT-006 | Track Points (production points) | P0 | |

#### 4.2.2 Timeframe Support

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| GMT-010 | Daily metrics view | P0 | Default view |
| GMT-011 | Weekly metrics view | P0 | |
| GMT-012 | Monthly metrics view | P0 | |
| GMT-013 | Quarterly metrics view | P0 | |
| GMT-014 | Yearly metrics view | P0 | |
| GMT-015 | Tab-based timeframe switching | P0 | |

#### 4.2.3 Goal Setting & Tracking

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| GMT-020 | Set goal for each metric per timeframe | P0 | Inline edit |
| GMT-021 | Display actual vs. goal | P0 | Side by side |
| GMT-022 | Calculate progress percentage | P0 | (actual/goal) * 100 |
| GMT-023 | Color-coded progress (green ≥100%, yellow 80-99%, red <80%) | P0 | Visual feedback |
| GMT-024 | Progress bar visualization | P0 | Animated |
| GMT-025 | Persist goals across sessions | P0 | Database storage |

#### 4.2.4 Calculated Metrics

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| GMT-030 | Calculate GUT Ratio (Closes / Kept Appointments × 100) | P0 | Key performance indicator |
| GMT-031 | Display total clients with JW split calculation | P0 | Formula: solo + (jw × 0.5) |
| GMT-032 | Show solo vs. JW client breakdown | P1 | Transparency |

#### 4.2.5 Bonus Tracking

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| GMT-040 | Create custom bonus with name and reward | P0 | |
| GMT-041 | Set bonus target (number) | P0 | |
| GMT-042 | Set bonus unit (closes, points, lives) | P0 | Dropdown |
| GMT-043 | Set bonus deadline | P0 | Date picker |
| GMT-044 | Track current progress toward bonus | P0 | Manual or auto-linked |
| GMT-045 | Calculate days remaining to deadline | P0 | Real-time |
| GMT-046 | Show bonus completion status | P0 | Badge indicator |
| GMT-047 | Progress bar per bonus | P0 | |
| GMT-048 | Edit existing bonus | P1 | |
| GMT-049 | Delete/archive completed bonus | P1 | |
| GMT-050 | Display active bonuses count | P1 | Summary card |

---

### 4.3 Summary Dashboard

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| DASH-001 | Total Clients card with JW split | P0 | |
| DASH-002 | GUT Ratio card | P0 | |
| DASH-003 | Current timeframe points card | P0 | |
| DASH-004 | Active bonuses count card | P0 | |
| DASH-005 | Quick navigation to detailed views | P1 | |

---

### 4.4 User Management (Phase 2)

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| USER-001 | User registration/login | P1 | Email/password |
| USER-002 | Profile management | P2 | |
| USER-003 | Data isolation per user | P1 | Multi-tenant |
| USER-004 | Password reset | P2 | |

---

### 4.5 Data Management

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| DATA-001 | Local-first architecture (offline capable) | P0 | SQLite |
| DATA-002 | Data export (CSV) | P2 | |
| DATA-003 | Data backup | P2 | |
| DATA-004 | Cloud sync (optional) | P3 | Future |

---

## 5. User Stories

### Epic 1: Client Pipeline Management

```
US-101: As an advisor, I want to add a new client quickly so I can start tracking them immediately after our first contact.

US-102: As an advisor, I want to see all my active clients in one list so I can prioritize my daily outreach.

US-103: As an advisor, I want to mark pipeline steps as complete so I never forget where I am with each client.

US-104: As an advisor, I want to see a visual progress bar for each client so I know at a glance how far along they are.

US-105: As an advisor, I want to search and filter my clients so I can quickly find who I'm looking for.

US-106: As an advisor, I want to mark a client as "stalled" so I can focus on active opportunities without deleting them.

US-107: As an advisor, I want to track which clients are JW partnerships so my metrics are calculated correctly.
```

### Epic 2: Metric Tracking

```
US-201: As an advisor, I want to set daily dial goals so I stay accountable to my activity targets.

US-202: As an advisor, I want to see my weekly metrics at a glance so I can adjust my effort mid-week.

US-203: As an advisor, I want to track my GUT ratio so I can measure my closing effectiveness.

US-204: As an advisor, I want to see red/yellow/green indicators so I instantly know if I'm on track.

US-205: As an advisor, I want to switch between timeframes (daily/weekly/monthly/quarterly/yearly) so I can see both short and long-term progress.
```

### Epic 3: Bonus Tracking

```
US-301: As an advisor, I want to add a custom bonus I'm working toward so I can track my progress.

US-302: As an advisor, I want to see how many days are left until my bonus deadline so I can plan accordingly.

US-303: As an advisor, I want to see my bonus progress as a percentage so I know exactly where I stand.

US-304: As an advisor, I want to celebrate when I complete a bonus so I feel accomplished.
```

---

## 6. Success Metrics

### Product KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily Active Users (DAU) | 70% of registered users | Analytics |
| Pipeline Step Completion Rate | 85% of clients reach Step 20+ | Database query |
| Goal Achievement Rate | 60% of users hit weekly goals | Database query |
| User Retention (30-day) | 80% | Cohort analysis |
| Time to Add Client | < 30 seconds | User testing |
| NPS Score | > 50 | Survey |

### Business KPIs

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Pilot Users | 50 advisors | Month 1 |
| Paid Subscribers | 200 | Month 6 |
| Revenue | $2,000 MRR | Month 6 |
| Advisor Productivity Increase | 20% | Self-reported |

---

## 7. Constraints & Assumptions

### Constraints

1. **Regulatory**: Cannot store sensitive client financial data (SSN, account numbers)
2. **Integration**: No direct integration with NM corporate systems in Phase 1
3. **Platform**: Web-first; native mobile is Phase 2+
4. **Budget**: Bootstrap/lean development approach

### Assumptions

1. Advisors have reliable internet access (with offline fallback)
2. The 43-step process is standardized across NM
3. Advisors are willing to adopt a new tool alongside corporate CRM
4. JW splits are always 50/50

### Dependencies

1. Access to accurate 43-step process documentation
2. Understanding of current bonus structures
3. User feedback for iteration

---

## 8. Timeline & Phases

### Phase 1: MVP (Weeks 1-4)

**Goal**: Core functionality for pilot users

- Client Pipeline Tracker (full)
- Granum Metric Tracker (basic - no persistence)
- Local SQLite database
- Single-user mode

### Phase 2: Enhanced Metrics (Weeks 5-8)

**Goal**: Full metric tracking with persistence

- Granum Metrics backend (database + API)
- Bonus tracking backend
- Goal persistence
- Data entry improvements

### Phase 3: Polish & Launch (Weeks 9-12)

**Goal**: Production-ready release

- User authentication
- Cloud backup option
- Mobile-responsive design
- Onboarding flow
- Analytics integration

### Phase 4: Scale (Months 4-6)

**Goal**: Growth features

- Team/manager dashboards
- Advanced analytics
- Mobile native apps
- Integrations (calendar, email)

---

## Appendix A: 43-Step NM Sales Process

| Step | Phase | Action |
|------|-------|--------|
| 1 | Initial Contact | Call and schedule appointment |
| 2 | Initial Contact | Update CRM mobile |
| 3 | Initial Contact | Send invite to JW partner |
| 4 | Initial Contact | Share contact with JW in CRM |
| 5 | Initial Contact | Send confirmation email |
| 6 | Initial Contact | Schedule day-before confirmation call |
| 7 | Initial Contact | Text morning of reminder (with office instructions if in-person) |
| 8 | Discovery | Conduct Discovery meeting |
| 9 | Discovery | Update CRM mobile |
| 10 | Discovery | Send invite to JW partner |
| 11 | Discovery | Share referral contacts with JW partner |
| 12 | Discovery | Send follow-up email with checklist and Budget PDF |
| 13 | Discovery | Complete case notes |
| 14 | Discovery | Scan FF & move to SET folder |
| 15 | Discovery | Upload FF to Docket |
| 16 | Discovery | Update contact in CRM |
| 17 | Planning Prep | Create feedlist |
| 18 | Planning Prep | Create PX |
| 19 | Planning Prep | Create recommendation illustrations |
| 20 | Planning Prep | Print PX/illustrations if meeting in-person |
| 21 | Planning Prep | Schedule day-before confirmation call |
| 22 | Planning Prep | Text morning of reminder |
| 23 | Planning | Conduct Planning meeting |
| 24 | Planning | Update CRM mobile |
| 25 | Planning | Send invite to JW partner |
| 26 | Planning | Share referral contacts with JW partner |
| 27 | Planning | Send follow-up email |
| 28 | Planning | Complete case notes |
| 29 | Planning | Upload PX/illustrations to SET folder |
| 30 | Planning | Upload PX/illustrations to Docket |
| 31 | Closing | Conduct Closing meeting |
| 32 | Closing | Update CRM mobile |
| 33 | Closing | Share referral contacts with JW partner |
| 34 | Closing | Send follow-up email |
| 35 | Closing | Complete case notes |
| 36 | Application | Send CDC to SET |
| 37 | Application | Update contact in CRM |
| 38 | Application | Have client complete OMHQ |
| 39 | Application | Schedule nurse visit or saliva swab (if needed) |
| 40 | Application | Have client e-sign the application |
| 41 | Application | Have SET submit the application |
| 42 | Application | Notify client that the application has been submitted |
| 43 | Follow-up | Schedule a follow-up in 3 months |

---

## Appendix B: Granum Metrics Definitions

| Metric | Definition | Typical Daily Goal |
|--------|------------|-------------------|
| Dials | Outbound phone calls made | 30 |
| Appointments | New meetings scheduled | 3 |
| Kept Appointments | Scheduled meetings that occurred | 2 |
| Closes | Deals/policies closed | 1 |
| Lives | Number of lives covered by policies | 2 |
| Points | Production points (internal NM metric) | 500 |

**GUT Ratio**: (Closes / Kept Appointments) × 100
*Industry benchmark: 30-40%*

**JW Split**: Joint Work clients count as 0.5 toward personal metrics

---

## Appendix C: Bonus Structure Examples

| Bonus Name | Target | Unit | Typical Deadline | Reward |
|------------|--------|------|------------------|--------|
| Rookie Bonus | 12 | Closes | 90 days | $2,500 |
| Q1 Contest | 15,000 | Points | Quarter end | Trip |
| Lives Milestone | 50 | Lives | 6 months | $1,000 |
| Monthly Club | 10 | Closes | Monthly | Recognition |

---

*Document maintained by: Product Team*
*Last updated: December 15, 2025*
