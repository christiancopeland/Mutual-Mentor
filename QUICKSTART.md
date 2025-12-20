# Quick Start Guide
## Mutual Mentor - Northwestern Mutual Advisor CRM

## Phase 1 Complete! 🎉

Congratulations! The Client Pipeline Tracker is now fully functional.

## Running the Application

### Option 1: Run Both Servers Simultaneously (Recommended)
```bash
npm run dev
```

This will start:
- **Backend Server:** http://localhost:3001
- **Frontend Client:** http://localhost:5173

### Option 2: Run Servers Separately

**Terminal 1 - Backend:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
npm run dev:client
```

## What You Can Do Now

### ✅ Client Pipeline Management
1. **Add Clients** - Click "Add Client" button to create new clients
2. **Track Progress** - View visual progress bars for each client
3. **43-Step Process** - Expand any client to see the full pipeline checklist
4. **Color-Coded Phases** - 7 distinct phases with different colors:
   - Initial Contact (Gray)
   - Discovery (Blue)
   - Planning Prep (Indigo)
   - Planning (Purple)
   - Closing (Pink)
   - Application (Orange)
   - Follow-up (Green)
5. **Search & Filter** - Find clients by name or filter by status
6. **JW Partners** - Track Joint Work partnerships with automatic attribution
7. **Client Status** - Mark clients as Active, Stalled, Completed, or Lost

### ✅ Granum Metrics Tracking
1. **Daily Metrics Entry** - Log your daily activity metrics
2. **Period Aggregation** - Automatic weekly/monthly/quarterly/yearly rollups
3. **Real-time Calculations** - Metrics calculated on-the-fly from daily entries
4. **Multiple Timeframes** - Track metrics across 5 different periods

### ✅ Analytics & Insights
1. **Pipeline Analytics** - Visual distribution of clients by phase and status
2. **Performance Trends** - Track metrics over time (weekly/monthly)
3. **Smart Insights** - Automated recommendations for client follow-ups
4. **Dashboard Overview** - Quick summary of key metrics and goals

### ✅ Settings & Configuration
1. **Fiscal Quarter Setup** - Configure Northwestern Mutual fiscal quarters
2. **Customizable Dates** - Set Q1-Q4 start dates (MM-DD format)
3. **General Settings** - Timezone, date format, week start preferences

### 🎯 Phase 1 Features - ALL COMPLETE!
- ✅ Complete CRUD operations for clients
- ✅ Interactive 43-step pipeline checklist
- ✅ Visual progress tracking with progress bars
- ✅ Phase-based organization
- ✅ Search functionality
- ✅ Status filtering
- ✅ Client statistics dashboard
- ✅ JW partner tracking
- ✅ Responsive design
- ✅ Real-time updates
- ✅ Granum metrics tracking with period aggregation
- ✅ Analytics dashboard with pipeline insights
- ✅ Performance trend visualization
- ✅ Settings page with fiscal quarter configuration

## Database Location

Your SQLite database is stored at:
```
server/data/crm.db
```

## API Endpoints

### Clients
- `GET /api/clients` - List all clients
- `GET /api/clients/:id` - Get single client
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Pipeline Steps
- `GET /api/clients/pipeline/steps` - Get all 43 steps
- `POST /api/clients/:id/steps/:stepNumber/complete` - Mark step complete
- `POST /api/clients/:id/steps/:stepNumber/uncomplete` - Mark step incomplete

### Metrics
- `GET /api/metrics?period_type=daily&date=2025-01-15` - Get metrics for period
- `PUT /api/metrics` - Update metrics
- `POST /api/metrics/entry` - Log a metric entry
- `POST /api/metrics/recalculate` - Recalculate all period metrics
- `GET /api/metrics/aggregated/:period_type` - Get aggregated metrics

### Goals
- `GET /api/goals` - Get all goals
- `PUT /api/goals/:period_type` - Update goals for a period

### Analytics
- `GET /api/analytics/pipeline` - Get pipeline distribution
- `GET /api/analytics/performance?period=weekly&limit=12` - Get performance trends
- `GET /api/analytics/summary` - Get monthly summary

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings
- `GET /api/settings/fiscal-quarter` - Get current fiscal quarter info

### Health
- `GET /api/health` - Server health check

## Testing the API

Test with curl:
```bash
# Health check
curl http://localhost:3001/api/health

# Get all clients
curl http://localhost:3001/api/clients

# Get pipeline steps
curl http://localhost:3001/api/clients/pipeline/steps

# Create a client
curl -X POST http://localhost:3001/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "phone": "555-1234",
    "email": "john@example.com",
    "referral_source": "Friend referral",
    "jw_partner": "Jane Doe"
  }'
```

## Directory Structure

```
Mutual_Mentor/
├── client/                      # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/         # Layout components
│   │   │   │   ├── Layout.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Header.jsx
│   │   │   ├── shared/         # Feature components
│   │   │   │   ├── ClientCard.jsx
│   │   │   │   ├── ClientForm.jsx
│   │   │   │   └── PipelineChecklist.jsx
│   │   │   └── ui/             # UI primitives
│   │   │       ├── Button.jsx
│   │   │       ├── Input.jsx
│   │   │       ├── Modal.jsx
│   │   │       ├── Badge.jsx
│   │   │       ├── ProgressBar.jsx
│   │   │       └── Card.jsx
│   │   ├── hooks/
│   │   │   └── useClients.js
│   │   ├── lib/
│   │   │   └── api.js
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Clients.jsx      # ✅ Fully Functional
│   │   │   └── GranumMetrics.jsx # 🔜 Phase 2
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
│
├── server/                      # Express Backend
│   ├── db/
│   │   ├── index.js            # Database functions
│   │   └── seed.js             # Seed data
│   ├── routes/
│   │   └── clients.js          # Client API routes
│   ├── data/
│   │   └── crm.db              # SQLite database
│   ├── index.js                # Server entry point
│   └── package.json
│
└── docs/
    ├── NM_ADVISOR_CRM_PRD.md
    ├── NM_ADVISOR_CRM_TECH_SPEC.md
    └── DEVELOPMENT_PHASES.md
```

## Next Steps: Phase 2

Phase 2 will add:
- ✨ Granum Metrics Tracker
- 📊 Goals management across 5 timeframes
- 🎯 Bonus tracking with deadlines
- 📈 GUT Ratio calculation
- 💪 JW client attribution (0.5x)
- 🎨 Enhanced dashboard

## Troubleshooting

### Port Already in Use

**Linux/macOS:**
```bash
# Kill processes on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill processes on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

**Windows:**
```powershell
# Find and kill process on port 3001 (backend)
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F

# Find and kill process on port 5173 (frontend)
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F
```

### Database Issues

**Linux/macOS:**
```bash
cd server
rm -rf data/crm.db
npm run seed
```

**Windows:**
```powershell
cd server
Remove-Item -Recurse -Force data\crm.db
npm run seed
```

### Dependency Issues

**Linux/macOS:**
```bash
# Clean install
rm -rf node_modules client/node_modules server/node_modules
rm package-lock.json client/package-lock.json server/package-lock.json
npm run install:all
```

**Windows:**
```powershell
# Clean install
Remove-Item -Recurse -Force node_modules, client\node_modules, server\node_modules
Remove-Item package-lock.json, client\package-lock.json, server\package-lock.json
npm run install:all
```

### Windows-Specific: better-sqlite3 Installation Issues

If you encounter errors during installation on Windows:

1. **Ensure prerequisites are installed:**
   - Python 3.x (added to PATH)
   - Visual Studio Build Tools with C++ workload

2. **Try rebuilding:**
   ```powershell
   cd server
   npm rebuild better-sqlite3
   ```

3. **If still failing, try a clean installation:**
   ```powershell
   cd server
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

See the main [README.md](README.md) for detailed Windows setup instructions.

## Support

For issues or questions:
- Check the [Technical Specification](docs/NM_ADVISOR_CRM_TECH_SPEC.md)
- Review the [Development Phases](docs/DEVELOPMENT_PHASES.md)
- Check the [PRD](docs/NM_ADVISOR_CRM_PRD.md)

---

**🎉 Phase 1 Complete!**

You now have a fully functional Client Pipeline Tracker. Try it out at http://localhost:5173!
