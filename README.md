# Mutual Mentor
## Northwestern Mutual Advisor CRM

A specialized CRM application designed specifically for Northwestern Mutual financial advisors to manage their client pipeline and track Granum metrics.

## Features

### Phase 1 (Current)
- **Client Pipeline Tracker** - Manage clients through the 43-step NM sales process
- 7 color-coded phases with visual progress tracking
- Client search and filtering
- JW (Joint Work) partner attribution

### Phase 2 (Planned)
- **Granum Metric Tracker** - Track activity and goals across multiple timeframes
- Custom bonus tracking
- Dashboard with summary metrics

### Phase 3 (Planned)
- Mobile-responsive design
- Data export (CSV)
- Analytics and insights

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router
- **Backend:** Node.js + Express + SQLite (better-sqlite3)
- **Architecture:** Local-first, offline-capable

## Getting Started

### Prerequisites

#### All Platforms
- Node.js 20+ LTS
- npm 10+

#### Windows-Specific Requirements
**Important**: This application uses `better-sqlite3`, a native Node.js module that requires compilation on Windows. You need:

1. **Python 3.x** - [Download Python](https://www.python.org/downloads/)
   - During installation, check "Add Python to PATH"

2. **Visual Studio Build Tools** - Choose ONE option:
   - **Option A (Recommended)**: Install via npm (as administrator):
     ```powershell
     npm install --global windows-build-tools
     ```
   - **Option B**: Download [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
     - Select "Desktop development with C++" workload
     - Install and restart your computer

3. **Run PowerShell or Command Prompt as Administrator** for installation steps

### Installation

#### Linux / macOS

1. Clone the repository:
```bash
git clone <repo-url>
cd Mutual_Mentor
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Initialize the database:
```bash
cd server && npm run seed
```

#### Windows

1. Clone the repository:
```powershell
git clone <repo-url>
cd Mutual_Mentor
```

2. Install dependencies (run as Administrator):
```powershell
npm run install:all
```

**If you encounter errors during `better-sqlite3` installation:**
- Ensure Python and Build Tools are installed (see Prerequisites above)
- Try rebuilding: `cd server && npm rebuild better-sqlite3`
- Alternatively, install globally first: `npm install -g better-sqlite3`

3. Set up environment variables:
```powershell
copy .env.example .env
```

4. Initialize the database:
```powershell
cd server
npm run seed
cd ..
```

### Development

Start both client and server in development mode:

**Linux/macOS:**
```bash
npm run dev
```

**Windows:**
```powershell
npm run dev
```

This will start:
- **Client:** http://localhost:5173
- **Server:** http://localhost:3001

Or run them separately:

**Linux/macOS:**
```bash
npm run dev:client  # Frontend only
npm run dev:server  # Backend only
```

**Windows:**
```powershell
npm run dev:client  # Frontend only
npm run dev:server  # Backend only
```

### Troubleshooting

#### Port Already in Use (All Platforms)

**Linux/macOS:**
```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or for port 5173
lsof -ti:5173 | xargs kill -9
```

**Windows:**
```powershell
# Find and kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F

# Or for port 5173
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F
```

#### better-sqlite3 Installation Issues (Windows)

1. **"Python not found" error:**
   - Install Python from python.org
   - Add Python to PATH during installation
   - Restart your terminal

2. **"MSBuild.exe not found" error:**
   - Install Visual Studio Build Tools (see Prerequisites)
   - Restart your computer after installation

3. **"Cannot find module 'better-sqlite3'" error:**
   - Delete `node_modules` folder in server directory
   - Run `npm install` again in server directory

4. **Still having issues?**
   - Try the pre-built binaries approach:
     ```powershell
     cd server
     npm install better-sqlite3 --build-from-source
     ```

### Production Build

1. Build the frontend:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

## Project Structure

```
Mutual_Mentor/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/    # Layout components
│   │   │   ├── shared/    # Reusable components
│   │   │   └── ui/        # UI primitives
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and API client
│   │   ├── pages/         # Page components
│   │   └── App.jsx
│   └── package.json
│
├── server/                # Express backend
│   ├── db/               # Database setup
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   ├── data/             # SQLite database file
│   └── package.json
│
└── docs/                 # Documentation
    ├── NM_ADVISOR_CRM_PRD.md
    ├── NM_ADVISOR_CRM_TECH_SPEC.md
    └── DEVELOPMENT_PHASES.md
```

## API Documentation

See [Technical Specification](docs/NM_ADVISOR_CRM_TECH_SPEC.md) for complete API documentation.

### Key Endpoints

**Clients:**
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client
- `POST /api/clients/:id/steps/:stepNumber/complete` - Mark step complete

**Pipeline:**
- `GET /api/clients/pipeline/steps` - Get all 43 steps

## Contributing

See [Development Phases](docs/DEVELOPMENT_PHASES.md) for the roadmap and current status.

## License

MIT

---

**Built for Northwestern Mutual Financial Advisors**
