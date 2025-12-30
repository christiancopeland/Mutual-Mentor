# Mutual Mentor Quick Start Guide

Get up and running with Mutual Mentor in minutes.

---

## For Users: Getting Started

### Step 1: Create Your Account

1. Open Mutual Mentor in your browser
2. Click **Create Account**
3. Enter your details:
   - **Name**: Your full name
   - **Email**: Your email address
   - **Password**: At least 12 characters with uppercase, lowercase, number, and special character

4. Click **Register**

### Step 2: Log In

1. Enter your email
2. Enter your password
3. Click **Sign In**

### Step 3: Add Your First Client

1. Click **Clients** in the navigation
2. Click **Add Client**
3. Enter client information:
   - First Name (required)
   - Last Name (required)
   - Phone, Email, Notes (optional)
4. Click **Save**

### Step 4: Log Your Daily Activity

1. Click **Metrics** in the navigation
2. Enter today's numbers:
   - Dials made
   - Meetings set
   - Meetings kept
   - etc.
3. Click **Save**

### Step 5: Set Your Goals

1. Click **Goals** in the navigation
2. Select period (Weekly, Monthly, etc.)
3. Enter your targets for each metric
4. Click **Save**

### Step 6: Track Progress on Dashboard

Your dashboard shows:
- Progress toward goals
- Pipeline overview
- Recent activity

---

## For Administrators: Quick Setup

### Prerequisites

- Node.js 18 or 20 (LTS)
- Git

### Installation (5 minutes)

```bash
# 1. Clone the repository
git clone <repository-url> mutual-mentor
cd mutual-mentor

# 2. Install server dependencies
cd server
npm install

# 3. Create environment file
cp .env.example .env

# 4. Generate JWT secret and update .env
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output to JWT_SECRET in .env

# 5. Start the server
npm start
# Server running on http://localhost:3001
```

### Client Setup

```bash
# In a new terminal
cd client
npm install
npm run dev
# Client running on http://localhost:5173
```

### Production Deployment

1. Set in `.env`:
```
NODE_ENV=production
JWT_SECRET=<your-64-char-secret>
DATABASE_PATH=/var/lib/mutual-mentor/crm.db
FRONTEND_URL=https://your-domain.com
```

2. Build client:
```bash
cd client && npm run build
```

3. Serve with PM2:
```bash
cd server && pm2 start npm --name mutual-mentor -- start
```

4. Configure nginx/Apache to:
   - Serve `client/dist` for frontend
   - Proxy `/api` to `localhost:3001`
   - Enable HTTPS

---

## Daily Workflow

### Morning Routine

1. **Check Dashboard** - Review goals and upcoming tasks
2. **Plan Dials** - Identify prospects to call
3. **Review Pipeline** - Check clients needing follow-up

### Throughout the Day

1. **Log Activity** - Record dials, meetings as they happen
2. **Update Clients** - Move through pipeline stages
3. **Add Notes** - Document important conversations

### End of Day

1. **Verify Metrics** - Ensure all activity is logged
2. **Check Progress** - Review goal progress
3. **Plan Tomorrow** - Note priority follow-ups

---

## Key Features Quick Reference

| Feature | Location | Purpose |
|---------|----------|---------|
| Dashboard | Home | Overview of all metrics |
| Clients | /clients | Manage client list |
| Metrics | /metrics | Log daily activity |
| Goals | /goals | Set targets by period |
| Bonuses | /bonuses | Track challenges |
| Analytics | /analytics | View reports |
| Settings | /settings | Personal preferences |

---

## Getting Help

- **User Guide**: [USER_GUIDE.md](USER_GUIDE.md) - Detailed feature documentation
- **Admin Guide**: [ADMIN_GUIDE.md](ADMIN_GUIDE.md) - Server setup and management
- **Support**: Contact your system administrator

---

## Security Reminders

- Use a strong, unique password
- Log out when using shared computers
- Never share your login credentials
- Report suspicious activity immediately

---

*For detailed documentation, see the full [User Guide](USER_GUIDE.md) or [Admin Guide](ADMIN_GUIDE.md).*
