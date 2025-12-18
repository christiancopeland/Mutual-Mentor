# Technical Specification
# Northwestern Mutual Advisor CRM
## Client Pipeline & Granum Metric Tracker

**Version:** 1.0
**Date:** December 15, 2025
**Status:** Draft

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Database Schema](#3-database-schema)
4. [API Specification](#4-api-specification)
5. [Frontend Components](#5-frontend-components)
6. [Data Models](#6-data-models)
7. [Business Logic](#7-business-logic)
8. [Security Considerations](#8-security-considerations)
9. [Deployment Strategy](#9-deployment-strategy)
10. [Migration from Holistix](#10-migration-from-holistix)

---

## 1. Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  React 18 + Vite + Tailwind CSS + React Router                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Pages     │  │ Components  │  │    Custom Hooks         │ │
│  │  - Clients  │  │ - ClientCard│  │  - useClients()         │ │
│  │  - Metrics  │  │ - Pipeline  │  │  - useMetrics()         │ │
│  │  - Dashboard│  │ - MetricCard│  │  - useBonuses()         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                           │                                     │
│                    API Client (fetch)                           │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTP/REST
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER (Node.js)                           │
├─────────────────────────────────────────────────────────────────┤
│  Express.js                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     API Routes                           │   │
│  │  /api/clients    /api/metrics    /api/bonuses           │   │
│  │  /api/goals      /api/analytics  /api/auth (Phase 2)    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│                    Database Layer                               │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (SQLite)                            │
├─────────────────────────────────────────────────────────────────┤
│  better-sqlite3 (synchronous, local-first)                      │
│  - clients, pipeline_steps, granum_metrics                      │
│  - goals, bonuses, metric_entries                               │
└─────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Local-First**: SQLite for zero-config, instant startup, offline capability
2. **Monorepo**: Single repository with `/client` and `/server` directories
3. **REST API**: Simple HTTP endpoints, JSON payloads
4. **Component-Driven**: Reusable React components with clear boundaries
5. **Type Safety**: JSDoc annotations (TypeScript in Phase 2)

---

## 2. Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| Vite | 5.x | Build tool & dev server |
| Tailwind CSS | 3.x | Utility-first styling |
| React Router | 6.x | Client-side routing |
| Lucide React | Latest | Icon library |
| Recharts | 2.x | Data visualization |
| clsx | Latest | Conditional classNames |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x LTS | Runtime |
| Express.js | 4.x | HTTP server framework |
| better-sqlite3 | 9.x | SQLite database driver |
| cors | Latest | CORS middleware |
| dotenv | Latest | Environment variables |

### Development

| Tool | Purpose |
|------|---------|
| npm | Package management |
| ESLint | Code linting |
| Prettier | Code formatting |
| Vitest | Unit testing |
| Playwright | E2E testing |

---

## 3. Database Schema

### 3.1 Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,  -- Phase 2
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 Clients Table

```sql
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',

  -- Basic Info
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,

  -- Pipeline Tracking
  current_step INTEGER DEFAULT 1,
  completed_steps TEXT DEFAULT '[]',  -- JSON array of step numbers
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'stalled', 'completed', 'lost')),

  -- Relationship
  referral_source TEXT,
  jw_partner TEXT,  -- Joint Work partner name (affects metric splits)
  notes TEXT,
  referral_contacts TEXT DEFAULT '[]',  -- JSON array of referral names

  -- Timestamps
  date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_contact_date DATETIME,
  next_action_due DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Foreign Keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_clients_user_status ON clients(user_id, status);
CREATE INDEX idx_clients_jw ON clients(user_id, jw_partner);
```

### 3.3 Pipeline Steps Table

```sql
CREATE TABLE pipeline_steps (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',
  step_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  phase TEXT NOT NULL,
  is_default INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,

  UNIQUE(user_id, step_number)
);

-- Default 43 steps seeded on initialization
```

### 3.4 Granum Metrics Table (NEW)

```sql
CREATE TABLE granum_metrics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',

  -- Period Definition
  period_type TEXT NOT NULL
    CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,  -- First day of the period
  period_end DATE NOT NULL,    -- Last day of the period

  -- Actual Values
  dials INTEGER DEFAULT 0,
  appointments INTEGER DEFAULT 0,
  kept_appointments INTEGER DEFAULT 0,
  closes INTEGER DEFAULT 0,
  lives INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,

  -- Client Counts
  solo_clients INTEGER DEFAULT 0,
  jw_clients INTEGER DEFAULT 0,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, period_type, period_start)
);

CREATE INDEX idx_metrics_user_period ON granum_metrics(user_id, period_type, period_start);
```

### 3.5 Goals Table (NEW)

```sql
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',

  period_type TEXT NOT NULL
    CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),

  -- Goal Values per Metric
  dials_goal INTEGER DEFAULT 0,
  appointments_goal INTEGER DEFAULT 0,
  kept_appointments_goal INTEGER DEFAULT 0,
  closes_goal INTEGER DEFAULT 0,
  lives_goal INTEGER DEFAULT 0,
  points_goal INTEGER DEFAULT 0,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(user_id, period_type)
);
```

### 3.6 Bonuses Table (NEW)

```sql
CREATE TABLE bonuses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',

  name TEXT NOT NULL,
  description TEXT,
  reward TEXT NOT NULL,  -- e.g., "$2,500", "Trip to Hawaii"

  -- Target Definition
  target_value INTEGER NOT NULL,
  target_unit TEXT NOT NULL
    CHECK (target_unit IN ('closes', 'points', 'lives', 'appointments', 'dials')),

  -- Progress
  current_value INTEGER DEFAULT 0,

  -- Timeline
  start_date DATE,
  deadline DATE NOT NULL,

  -- Status
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'expired', 'archived')),
  completed_at DATETIME,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bonuses_user_status ON bonuses(user_id, status);
CREATE INDEX idx_bonuses_deadline ON bonuses(deadline);
```

### 3.7 Metric Entries Table (NEW - for detailed tracking)

```sql
CREATE TABLE metric_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',

  date DATE NOT NULL,
  metric_type TEXT NOT NULL
    CHECK (metric_type IN ('dial', 'appointment', 'kept_appointment', 'close', 'life', 'point')),
  value INTEGER DEFAULT 1,

  -- Optional linkage
  client_id TEXT,
  notes TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
);

CREATE INDEX idx_entries_user_date ON metric_entries(user_id, date);
CREATE INDEX idx_entries_type ON metric_entries(metric_type);
```

### Entity Relationship Diagram

```
┌──────────┐       ┌───────────────┐       ┌────────────────┐
│  users   │──1:N──│    clients    │──N:1──│ pipeline_steps │
└──────────┘       └───────────────┘       └────────────────┘
     │
     │ 1:N
     ▼
┌──────────────┐
│granum_metrics│
└──────────────┘
     │
     │ N:1 (by period_type)
     ▼
┌──────────┐
│  goals   │
└──────────┘

┌──────────┐
│  users   │──1:N──┌──────────┐
└──────────┘       │ bonuses  │
                   └──────────┘

┌──────────┐       ┌───────────────┐
│  users   │──1:N──│metric_entries │
└──────────┘       └───────────────┘
```

---

## 4. API Specification

### 4.1 Client Endpoints

#### GET /api/clients
List all clients for the current user.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | Filter by status (active, stalled, completed, lost, all) |
| search | string | Search by client name |

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "John Smith",
    "phone": "555-1234",
    "email": "john@example.com",
    "current_step": 8,
    "completed_steps": [1, 2, 3, 4, 5, 6, 7],
    "status": "active",
    "referral_source": "Friend",
    "jw_partner": "Jane Doe",
    "notes": "Interested in life insurance",
    "referral_contacts": ["Bob", "Alice"],
    "date_added": "2025-01-15T10:30:00Z",
    "last_contact_date": "2025-01-20T14:00:00Z"
  }
]
```

#### GET /api/clients/:id
Get single client with pipeline steps.

#### POST /api/clients
Create new client.

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "555-1234",
  "email": "john@example.com",
  "referral_source": "Referral from Bob",
  "jw_partner": "Jane Doe",
  "notes": "Initial notes"
}
```

#### PUT /api/clients/:id
Update client.

#### DELETE /api/clients/:id
Delete client.

#### POST /api/clients/:id/steps/:stepNumber/complete
Mark pipeline step as complete.

**Response:**
```json
{
  "id": "uuid",
  "completed_steps": [1, 2, 3, 4, 5, 6, 7, 8],
  "current_step": 9,
  "status": "active"
}
```

#### POST /api/clients/:id/steps/:stepNumber/uncomplete
Mark pipeline step as incomplete.

#### GET /api/clients/pipeline/steps
Get all pipeline steps.

**Response:**
```json
[
  {
    "id": 1,
    "step_number": 1,
    "name": "Call and schedule appointment",
    "phase": "Initial Contact"
  }
]
```

---

### 4.2 Metrics Endpoints (NEW)

#### GET /api/metrics
Get metrics for a specific period.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| period_type | string | daily, weekly, monthly, quarterly, yearly |
| date | string | ISO date within the period (defaults to today) |

**Response:**
```json
{
  "period": {
    "type": "weekly",
    "start": "2025-12-09",
    "end": "2025-12-15"
  },
  "metrics": {
    "dials": { "actual": 145, "goal": 150 },
    "appointments": { "actual": 12, "goal": 15 },
    "kept_appointments": { "actual": 10, "goal": 12 },
    "closes": { "actual": 2, "goal": 3 },
    "lives": { "actual": 4, "goal": 6 },
    "points": { "actual": 2500, "goal": 2500 }
  },
  "calculated": {
    "gut_ratio": 20.0,
    "total_clients": 10,
    "solo_clients": 8,
    "jw_clients": 4
  }
}
```

#### PUT /api/metrics
Update metrics for a period (upsert).

**Request Body:**
```json
{
  "period_type": "weekly",
  "period_start": "2025-12-09",
  "dials": 150,
  "appointments": 13,
  "kept_appointments": 11,
  "closes": 3,
  "lives": 5,
  "points": 3000
}
```

#### POST /api/metrics/entry
Log a single metric entry.

**Request Body:**
```json
{
  "metric_type": "dial",
  "value": 1,
  "client_id": "uuid",
  "notes": "Left voicemail"
}
```

#### GET /api/metrics/summary
Get summary across all timeframes.

**Response:**
```json
{
  "daily": { "closes": { "actual": 1, "goal": 1, "percent": 100 } },
  "weekly": { "closes": { "actual": 3, "goal": 5, "percent": 60 } },
  "monthly": { "closes": { "actual": 8, "goal": 12, "percent": 67 } },
  "quarterly": { "closes": { "actual": 24, "goal": 36, "percent": 67 } },
  "yearly": { "closes": { "actual": 80, "goal": 144, "percent": 56 } }
}
```

---

### 4.3 Goals Endpoints (NEW)

#### GET /api/goals
Get all goals for user.

**Response:**
```json
{
  "daily": {
    "dials": 30,
    "appointments": 3,
    "kept_appointments": 2,
    "closes": 1,
    "lives": 2,
    "points": 500
  },
  "weekly": { ... },
  "monthly": { ... },
  "quarterly": { ... },
  "yearly": { ... }
}
```

#### PUT /api/goals/:periodType
Update goals for a period type.

**Request Body:**
```json
{
  "dials": 30,
  "appointments": 3,
  "kept_appointments": 2,
  "closes": 1,
  "lives": 2,
  "points": 500
}
```

---

### 4.4 Bonuses Endpoints (NEW)

#### GET /api/bonuses
List all bonuses (active by default).

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | Filter by status (active, completed, expired, all) |

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Rookie Bonus",
    "reward": "$2,500",
    "target_value": 12,
    "target_unit": "closes",
    "current_value": 8,
    "deadline": "2025-03-31",
    "status": "active",
    "progress_percent": 66.67,
    "days_remaining": 106
  }
]
```

#### POST /api/bonuses
Create new bonus.

**Request Body:**
```json
{
  "name": "Q1 Contest",
  "reward": "Trip to Hawaii",
  "target_value": 15000,
  "target_unit": "points",
  "deadline": "2025-03-31",
  "start_date": "2025-01-01"
}
```

#### PUT /api/bonuses/:id
Update bonus.

#### DELETE /api/bonuses/:id
Delete/archive bonus.

#### PUT /api/bonuses/:id/progress
Update bonus progress.

**Request Body:**
```json
{
  "current_value": 10
}
```

---

### 4.5 Analytics Endpoints

#### GET /api/analytics/pipeline
Pipeline analytics.

**Response:**
```json
{
  "total_clients": 45,
  "by_status": {
    "active": 30,
    "completed": 10,
    "stalled": 4,
    "lost": 1
  },
  "by_phase": {
    "Initial Contact": 8,
    "Discovery": 7,
    "Planning Prep": 5,
    "Planning": 4,
    "Closing": 3,
    "Application": 2,
    "Follow-up": 1
  },
  "avg_completion_time_days": 45
}
```

#### GET /api/analytics/performance
Performance trends.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| period | string | week, month, quarter |

**Response:**
```json
{
  "trend": [
    { "date": "2025-12-01", "closes": 2, "goal": 3 },
    { "date": "2025-12-08", "closes": 3, "goal": 3 },
    { "date": "2025-12-15", "closes": 2, "goal": 3 }
  ],
  "gut_ratio_trend": [
    { "date": "2025-12-01", "ratio": 18.5 },
    { "date": "2025-12-08", "ratio": 22.0 },
    { "date": "2025-12-15", "ratio": 20.0 }
  ]
}
```

---

## 5. Frontend Components

### 5.1 Component Hierarchy

```
App
├── Layout
│   ├── Sidebar
│   │   ├── NavItem
│   │   └── Logo
│   └── Header
│       ├── PageTitle
│       └── QuickActions
│
├── Pages
│   ├── Dashboard
│   │   ├── SummaryCard (×4)
│   │   ├── QuickMetrics
│   │   └── ActiveBonuses
│   │
│   ├── Clients
│   │   ├── ClientStats (×4 cards)
│   │   ├── SearchBar
│   │   ├── FilterDropdown
│   │   ├── ClientList
│   │   │   └── ClientCard (×N)
│   │   │       ├── ClientInfo
│   │   │       ├── ProgressBar
│   │   │       └── PipelineChecklist
│   │   │           └── PhaseSection (×7)
│   │   │               └── StepItem (×N)
│   │   └── ClientFormModal
│   │
│   └── GranumMetrics
│       ├── SummaryCards (×4)
│       ├── TimeframeTabs
│       ├── MetricsGrid
│       │   └── MetricCard (×6)
│       └── BonusSection
│           └── BonusCard (×N)
│
└── Shared
    ├── Modal
    ├── Button
    ├── Input
    ├── Select
    ├── Badge
    ├── ProgressBar
    └── Card
```

### 5.2 Key Components (Extracted from Holistix)

#### ClientCard Component
**Source:** `client/src/components/shared/ClientCard.jsx`
**Lines:** 242

**Props:**
```javascript
{
  client: Object,
  pipelineSteps: Array,
  onToggleStep: Function,
  onEdit: Function,
  onDelete: Function,
  isExpanded: Boolean,
  onToggleExpand: Function
}
```

**Features:**
- Visual progress bar
- Current phase badge
- Contact information display
- Expandable pipeline checklist
- Edit/Delete actions

#### PipelineChecklist Component
**Source:** `client/src/components/shared/PipelineChecklist.jsx`
**Lines:** 188

**Props:**
```javascript
{
  steps: Array,
  completedSteps: Array,
  onToggleStep: Function,
  isLoading: Boolean
}
```

**Features:**
- 7 color-coded phases
- Collapsible sections
- Progress tracking per phase
- Interactive checkboxes with loading states
- Phase completion indicators

#### MetricCard Component (to be extracted)
**Source:** `client/src/pages/GranumMetrics.jsx` (inline)

**Props:**
```javascript
{
  metric: {
    id: String,
    name: String,
    icon: Component,
    color: String,
    bgColor: String,
    description: String
  },
  data: {
    actual: Number,
    goal: Number
  },
  isEditing: Boolean,
  onEdit: Function,
  onSave: Function,
  onCancel: Function,
  editValue: String,
  setEditValue: Function
}
```

#### BonusCard Component (to be extracted)
**Source:** `client/src/pages/GranumMetrics.jsx` (inline)

**Props:**
```javascript
{
  bonus: {
    id: String,
    name: String,
    target: Number,
    current: Number,
    unit: String,
    deadline: String,
    reward: String
  }
}
```

### 5.3 Custom Hooks

#### useClients Hook
**Source:** `client/src/hooks/useClients.js`

```javascript
function useClients() {
  return {
    clients: Array,
    loading: Boolean,
    error: String | null,
    filters: { status: String, search: String },
    setFilters: Function,
    refetch: Function,
    createClient: Function,
    updateClient: Function,
    deleteClient: Function,
    toggleStep: Function
  };
}
```

#### useMetrics Hook (NEW)

```javascript
function useMetrics(periodType = 'weekly') {
  return {
    metrics: Object,
    goals: Object,
    loading: Boolean,
    error: String | null,
    updateMetric: Function,
    updateGoal: Function,
    logEntry: Function,
    refetch: Function
  };
}
```

#### useBonuses Hook (NEW)

```javascript
function useBonuses() {
  return {
    bonuses: Array,
    loading: Boolean,
    error: String | null,
    createBonus: Function,
    updateBonus: Function,
    updateProgress: Function,
    deleteBonus: Function
  };
}
```

---

## 6. Data Models

### 6.1 TypeScript Interfaces (Reference)

```typescript
// Client
interface Client {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  current_step: number;
  completed_steps: number[];
  status: 'active' | 'stalled' | 'completed' | 'lost';
  referral_source?: string;
  jw_partner?: string;
  notes?: string;
  referral_contacts: string[];
  date_added: string;
  last_contact_date?: string;
  next_action_due?: string;
}

// Pipeline Step
interface PipelineStep {
  id: number;
  step_number: number;
  name: string;
  phase: Phase;
  is_default: boolean;
}

type Phase =
  | 'Initial Contact'
  | 'Discovery'
  | 'Planning Prep'
  | 'Planning'
  | 'Closing'
  | 'Application'
  | 'Follow-up';

// Granum Metrics
interface GranumMetrics {
  id: string;
  user_id: string;
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  dials: number;
  appointments: number;
  kept_appointments: number;
  closes: number;
  lives: number;
  points: number;
  solo_clients: number;
  jw_clients: number;
}

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

// Goals
interface Goals {
  id: string;
  user_id: string;
  period_type: PeriodType;
  dials_goal: number;
  appointments_goal: number;
  kept_appointments_goal: number;
  closes_goal: number;
  lives_goal: number;
  points_goal: number;
}

// Bonus
interface Bonus {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  reward: string;
  target_value: number;
  target_unit: 'closes' | 'points' | 'lives' | 'appointments' | 'dials';
  current_value: number;
  start_date?: string;
  deadline: string;
  status: 'active' | 'completed' | 'expired' | 'archived';
  completed_at?: string;
}
```

### 6.2 Default Values

```javascript
const DEFAULT_GOALS = {
  daily: {
    dials: 30,
    appointments: 3,
    kept_appointments: 2,
    closes: 1,
    lives: 2,
    points: 500
  },
  weekly: {
    dials: 150,
    appointments: 15,
    kept_appointments: 12,
    closes: 3,
    lives: 6,
    points: 2500
  },
  monthly: {
    dials: 600,
    appointments: 60,
    kept_appointments: 48,
    closes: 12,
    lives: 24,
    points: 10000
  },
  quarterly: {
    dials: 1800,
    appointments: 180,
    kept_appointments: 144,
    closes: 36,
    lives: 72,
    points: 30000
  },
  yearly: {
    dials: 7200,
    appointments: 720,
    kept_appointments: 576,
    closes: 144,
    lives: 288,
    points: 120000
  }
};
```

---

## 7. Business Logic

### 7.1 Pipeline Step Completion

```javascript
// When step is completed:
function completeStep(client, stepNumber) {
  const completedSteps = [...client.completed_steps];

  if (!completedSteps.includes(stepNumber)) {
    completedSteps.push(stepNumber);
    completedSteps.sort((a, b) => a - b);
  }

  const currentStep = Math.max(...completedSteps, 0) + 1;
  const isCompleted = completedSteps.length === 43;
  const status = isCompleted ? 'completed' : 'active';

  return {
    completed_steps: completedSteps,
    current_step: currentStep,
    status,
    last_contact_date: new Date().toISOString()
  };
}
```

### 7.2 GUT Ratio Calculation

```javascript
function calculateGutRatio(closes, keptAppointments) {
  if (keptAppointments === 0) return 0;
  return (closes / keptAppointments * 100).toFixed(1);
}
```

### 7.3 JW Client Split

```javascript
function calculateTotalClients(soloClients, jwClients) {
  return soloClients + (jwClients * 0.5);
}

// Example: 8 solo + 4 JW = 8 + 2 = 10 total
```

### 7.4 Progress Calculation

```javascript
function calculateProgress(actual, goal) {
  if (goal === 0) return 0;
  return Math.min((actual / goal) * 100, 100);
}

function getProgressStatus(progressPercent) {
  if (progressPercent >= 100) return 'on_track';    // Green
  if (progressPercent >= 80) return 'close';        // Yellow
  return 'behind';                                   // Red
}
```

### 7.5 Period Date Calculation

```javascript
function getPeriodBounds(periodType, referenceDate = new Date()) {
  const date = new Date(referenceDate);
  let start, end;

  switch (periodType) {
    case 'daily':
      start = end = date;
      break;

    case 'weekly':
      // Week starts Monday
      const dayOfWeek = date.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      start = new Date(date);
      start.setDate(date.getDate() + mondayOffset);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      break;

    case 'monthly':
      start = new Date(date.getFullYear(), date.getMonth(), 1);
      end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      break;

    case 'quarterly':
      const quarter = Math.floor(date.getMonth() / 3);
      start = new Date(date.getFullYear(), quarter * 3, 1);
      end = new Date(date.getFullYear(), quarter * 3 + 3, 0);
      break;

    case 'yearly':
      start = new Date(date.getFullYear(), 0, 1);
      end = new Date(date.getFullYear(), 11, 31);
      break;
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}
```

### 7.6 Bonus Days Remaining

```javascript
function calculateDaysRemaining(deadline) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
```

---

## 8. Security Considerations

### 8.1 Phase 1 (Single User, Local)

| Risk | Mitigation |
|------|------------|
| Data at rest | SQLite file on local disk; user responsible |
| No authentication | Single-user mode; no sensitive data stored |
| XSS | React's default escaping; no dangerouslySetInnerHTML |
| SQL Injection | Parameterized queries via better-sqlite3 |

### 8.2 Phase 2 (Multi-User)

| Risk | Mitigation |
|------|------------|
| Authentication | bcrypt password hashing; JWT tokens |
| Authorization | User ID scoping on all queries |
| Session hijacking | HTTPOnly cookies; secure flag in production |
| CSRF | SameSite cookie attribute |
| Data isolation | Row-level security via user_id foreign keys |

### 8.3 Data Privacy

- **No PII Storage**: Do not store SSN, account numbers, or financial data
- **Client Names Only**: Minimal personal information
- **Local-First**: Data stays on user's machine by default
- **Export Capability**: Users can export their data

---

## 9. Deployment Strategy

### 9.1 Development Environment

```bash
# Clone repository
git clone <repo-url>
cd nm-advisor-crm

# Install dependencies
npm install

# Start development servers (concurrent)
npm run dev
# → Client: http://localhost:5173
# → Server: http://localhost:3001
```

### 9.2 Production Build

```bash
# Build frontend
cd client && npm run build

# Server serves static files
# Deploy as single Node.js application
```

### 9.3 Deployment Options

| Option | Pros | Cons | Recommended For |
|--------|------|------|-----------------|
| Desktop App (Electron) | Offline, single install | Larger bundle | Power users |
| Self-Hosted | Full control | Requires server | Tech-savvy advisors |
| Cloud (Railway/Render) | Easy deployment | Monthly cost | Teams |
| Docker | Consistent env | Complexity | Enterprise |

### 9.4 Environment Variables

```env
# Server
PORT=3001
NODE_ENV=production
DATABASE_PATH=./data/crm.db

# Client (build-time)
VITE_API_URL=http://localhost:3001/api
```

---

## 10. Migration from Holistix

### 10.1 Files to Extract

| Source File | Target Location | Modifications |
|-------------|-----------------|---------------|
| `client/src/pages/Clients.jsx` | `client/src/pages/Clients.jsx` | Remove unrelated imports |
| `client/src/pages/GranumMetrics.jsx` | `client/src/pages/GranumMetrics.jsx` | Add API integration |
| `client/src/components/shared/ClientCard.jsx` | Same | None |
| `client/src/components/shared/ClientForm.jsx` | Same | None |
| `client/src/components/shared/PipelineChecklist.jsx` | Same | None |
| `client/src/hooks/useClients.js` | Same | None |
| `server/routes/clients.js` | Same | None |
| `server/db/index.js` | Same | Add new tables |
| `server/db/seed.js` | Same | None |

### 10.2 New Files to Create

| File | Purpose |
|------|---------|
| `server/routes/metrics.js` | Granum metrics API |
| `server/routes/goals.js` | Goals API |
| `server/routes/bonuses.js` | Bonuses API |
| `client/src/hooks/useMetrics.js` | Metrics hook |
| `client/src/hooks/useBonuses.js` | Bonuses hook |
| `client/src/components/shared/MetricCard.jsx` | Extract from page |
| `client/src/components/shared/BonusCard.jsx` | Extract from page |
| `client/src/pages/Dashboard.jsx` | New dashboard |

### 10.3 Database Migration

```sql
-- Run after extracting base schema

-- 1. Add new tables for metrics
CREATE TABLE IF NOT EXISTS granum_metrics (...);
CREATE TABLE IF NOT EXISTS goals (...);
CREATE TABLE IF NOT EXISTS bonuses (...);
CREATE TABLE IF NOT EXISTS metric_entries (...);

-- 2. Seed default goals
INSERT INTO goals (id, user_id, period_type, dials_goal, ...)
VALUES
  ('goal_daily', 'default', 'daily', 30, 3, 2, 1, 2, 500),
  ('goal_weekly', 'default', 'weekly', 150, 15, 12, 3, 6, 2500),
  ...;
```

### 10.4 Removed Dependencies (from Holistix)

The following Holistix features are **not** included:
- Relationships module
- Marriage tracking
- Church events
- Routines
- Journal
- Domain Balance
- Important Dates
- Batch Sessions

---

## Appendix A: File Structure

```
nm-advisor-crm/
├── client/
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Layout.jsx
│   │   │   ├── shared/
│   │   │   │   ├── ClientCard.jsx
│   │   │   │   ├── ClientForm.jsx
│   │   │   │   ├── PipelineChecklist.jsx
│   │   │   │   ├── MetricCard.jsx
│   │   │   │   └── BonusCard.jsx
│   │   │   └── ui/
│   │   │       ├── Modal.jsx
│   │   │       ├── Button.jsx
│   │   │       └── Input.jsx
│   │   ├── hooks/
│   │   │   ├── useClients.js
│   │   │   ├── useMetrics.js
│   │   │   └── useBonuses.js
│   │   ├── lib/
│   │   │   └── api.js
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Clients.jsx
│   │   │   └── GranumMetrics.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/
│   ├── data/
│   │   └── crm.db
│   ├── db/
│   │   ├── index.js
│   │   └── seed.js
│   ├── routes/
│   │   ├── clients.js
│   │   ├── metrics.js
│   │   ├── goals.js
│   │   ├── bonuses.js
│   │   └── analytics.js
│   ├── middleware/
│   │   └── auth.js (Phase 2)
│   ├── index.js
│   └── package.json
│
├── docs/
│   ├── NM_ADVISOR_CRM_PRD.md
│   └── NM_ADVISOR_CRM_TECH_SPEC.md
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Appendix B: API Response Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation error |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected error |

---

## Appendix C: Color System

### Phase Colors (Pipeline)

| Phase | Background | Border | Text |
|-------|------------|--------|------|
| Initial Contact | bg-gray-100 | border-gray-300 | text-gray-700 |
| Discovery | bg-blue-50 | border-blue-300 | text-blue-700 |
| Planning Prep | bg-indigo-50 | border-indigo-300 | text-indigo-700 |
| Planning | bg-purple-50 | border-purple-300 | text-purple-700 |
| Closing | bg-pink-50 | border-pink-300 | text-pink-700 |
| Application | bg-orange-50 | border-orange-300 | text-orange-700 |
| Follow-up | bg-green-50 | border-green-300 | text-green-700 |

### Metric Colors

| Metric | Color | Background |
|--------|-------|------------|
| Dials | text-blue-600 | bg-blue-50 |
| Appointments | text-purple-600 | bg-purple-50 |
| Kept Appointments | text-green-600 | bg-green-50 |
| Closes | text-emerald-600 | bg-emerald-50 |
| Lives | text-orange-600 | bg-orange-50 |
| Points | text-pink-600 | bg-pink-50 |

### Progress Colors

| Status | Threshold | Color |
|--------|-----------|-------|
| On Track | ≥ 100% | Green (#22C55E) |
| Close | 80-99% | Yellow (#EAB308) |
| Behind | < 80% | Red (#EF4444) |

---

*Document maintained by: Engineering Team*
*Last updated: December 15, 2025*
