# Mutual Mentor Administrator Guide

A comprehensive guide for system administrators deploying and managing Mutual Mentor CRM.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Security Setup](#security-setup)
5. [User Management](#user-management)
6. [Database Management](#database-management)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Recovery](#backup--recovery)
9. [Troubleshooting](#troubleshooting)
10. [Compliance](#compliance)
11. [Maintenance](#maintenance)

---

## System Requirements

### Server Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Node.js | 18.x | 20.x LTS |
| RAM | 512 MB | 2 GB |
| Storage | 1 GB | 10 GB |
| CPU | 1 core | 2+ cores |

### Supported Platforms

- **Linux**: Ubuntu 20.04+, CentOS 8+, RHEL 8+
- **Windows**: Windows Server 2019+, Windows 10/11
- **macOS**: macOS 12+ (development only)

### Network Requirements

- HTTPS support (TLS 1.2+)
- Ports: 443 (HTTPS), 3001 (API, internal)
- Outbound: None required

---

## Installation

### Prerequisites

1. Install Node.js 20.x LTS:
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Windows
# Download from https://nodejs.org/
```

2. Clone or extract the application:
```bash
git clone <repository-url> /opt/mutual-mentor
cd /opt/mutual-mentor
```

### Server Installation

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install --production
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment (see [Configuration](#configuration))

5. Initialize database:
```bash
npm run start
# Stop with Ctrl+C after initial setup
```

### Client Installation

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Build for production:
```bash
npm run build
```

4. Serve the `dist` folder via your web server (nginx, Apache, etc.)

---

## Configuration

### Environment Variables

Create/edit `/opt/mutual-mentor/server/.env`:

```bash
# ===========================================
# ENVIRONMENT
# ===========================================
NODE_ENV=production

# ===========================================
# SERVER
# ===========================================
PORT=3001

# ===========================================
# DATABASE
# ===========================================
# Store OUTSIDE application directory for security
DATABASE_PATH=/var/lib/mutual-mentor/crm.db

# ===========================================
# AUTHENTICATION
# ===========================================
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<your-64-character-random-secret>

# Token expiration (default: 24h)
JWT_EXPIRATION=24h

# ===========================================
# CORS
# ===========================================
# Your frontend domain (no trailing slash)
FRONTEND_URL=https://your-domain.com
```

### Generating JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output to `JWT_SECRET` in your `.env` file.

### Production Checklist

- [ ] `NODE_ENV=production`
- [ ] Strong, unique `JWT_SECRET` (64+ characters)
- [ ] `DATABASE_PATH` outside application directory
- [ ] `FRONTEND_URL` matches your domain exactly
- [ ] `.env` file has restricted permissions (600)
- [ ] Database directory has restricted permissions (700)

---

## Security Setup

### File Permissions

```bash
# Restrict .env file
chmod 600 /opt/mutual-mentor/server/.env

# Restrict database directory
sudo mkdir -p /var/lib/mutual-mentor
sudo chown www-data:www-data /var/lib/mutual-mentor
sudo chmod 700 /var/lib/mutual-mentor
```

### Reverse Proxy (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Frontend
    location / {
        root /opt/mutual-mentor/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
sudo ufw enable

# Ensure port 3001 is NOT exposed externally
# It should only be accessible from localhost via nginx proxy
```

### Security Headers

The application includes Helmet middleware which sets:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (when behind HTTPS proxy)
- Content-Security-Policy

### Rate Limiting

Built-in rate limiting:
- **Auth endpoints**: 5 requests per 15 minutes (per IP)
- **General API**: 100 requests per 15 minutes (per IP)

---

## User Management

### User Registration

Users self-register at `/register`. Password requirements:
- Minimum 12 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

### Password Reset

Currently, password resets require:
1. User requests reset via administrator
2. Admin accesses database directly (see below)
3. Admin provides temporary password

**Planned Feature**: Self-service password reset via email

### Viewing Users (Database)

```bash
sqlite3 /var/lib/mutual-mentor/crm.db "SELECT id, email, name, created_at FROM users;"
```

### Deactivating a User

To prevent a user from logging in:

```bash
# Option 1: Change their password to something random
sqlite3 /var/lib/mutual-mentor/crm.db "UPDATE users SET password = 'DEACTIVATED' WHERE email = 'user@example.com';"

# Option 2: Add a deactivated flag (requires schema update)
# Future feature
```

### Audit User Activity

View user actions via audit logs:

```bash
sqlite3 /var/lib/mutual-mentor/crm.db \
  "SELECT created_at, action, method, path FROM audit_logs WHERE user_id = 'user-id-here' ORDER BY created_at DESC LIMIT 50;"
```

---

## Database Management

### Database Location

- **Development**: `./data/crm.db`
- **Production**: `/var/lib/mutual-mentor/crm.db` (recommended)

### Viewing Database Schema

```bash
sqlite3 /var/lib/mutual-mentor/crm.db ".schema"
```

### Key Tables

| Table | Purpose |
|-------|---------|
| users | User accounts and authentication |
| clients | Client records (per user) |
| daily_metrics | Activity metrics by date |
| goals | Goal targets by period |
| bonuses | Bonus challenge tracking |
| settings | User preferences |
| audit_logs | Security audit trail |

### Database Maintenance

```bash
# Optimize database
sqlite3 /var/lib/mutual-mentor/crm.db "VACUUM;"

# Check integrity
sqlite3 /var/lib/mutual-mentor/crm.db "PRAGMA integrity_check;"

# Get database size
ls -lh /var/lib/mutual-mentor/crm.db
```

---

## Monitoring & Logging

### Application Logs

The server outputs logs to stdout/stderr. Capture with:

```bash
# Using PM2 (recommended)
pm2 start npm --name "mutual-mentor" -- start
pm2 logs mutual-mentor

# Using systemd
journalctl -u mutual-mentor -f
```

### Audit Logs

All API requests are logged to `audit_logs` table:

```bash
# Recent activity
sqlite3 /var/lib/mutual-mentor/crm.db \
  "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100;"

# Failed requests
sqlite3 /var/lib/mutual-mentor/crm.db \
  "SELECT * FROM audit_logs WHERE response_status >= 400 ORDER BY created_at DESC;"

# Activity by user
sqlite3 /var/lib/mutual-mentor/crm.db \
  "SELECT user_id, COUNT(*) as requests FROM audit_logs GROUP BY user_id ORDER BY requests DESC;"
```

### Health Check Endpoint

```bash
curl http://localhost:3001/api/health
# Returns: {"status":"healthy"}
```

### Setting Up PM2 Monitoring

```bash
# Install PM2
npm install -g pm2

# Start application
cd /opt/mutual-mentor/server
pm2 start npm --name "mutual-mentor" -- start

# Enable startup script
pm2 startup
pm2 save

# Monitor
pm2 monit
```

---

## Backup & Recovery

### Automated Backups

Create a backup script `/opt/mutual-mentor/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mutual-mentor"
DATE=$(date +%Y%m%d_%H%M%S)
DB_PATH="/var/lib/mutual-mentor/crm.db"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database (with SQLite's backup command for consistency)
sqlite3 $DB_PATH ".backup '$BACKUP_DIR/crm_$DATE.db'"

# Compress
gzip $BACKUP_DIR/crm_$DATE.db

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: crm_$DATE.db.gz"
```

Schedule with cron:
```bash
# Daily at 2 AM
0 2 * * * /opt/mutual-mentor/backup.sh >> /var/log/mutual-mentor-backup.log 2>&1
```

### Manual Backup

```bash
# Stop application first for consistency
pm2 stop mutual-mentor

# Copy database
cp /var/lib/mutual-mentor/crm.db /var/backups/crm_$(date +%Y%m%d).db

# Restart application
pm2 start mutual-mentor
```

### Recovery

```bash
# Stop application
pm2 stop mutual-mentor

# Restore from backup
gunzip /var/backups/mutual-mentor/crm_20241215.db.gz
cp /var/backups/mutual-mentor/crm_20241215.db /var/lib/mutual-mentor/crm.db

# Fix permissions
chown www-data:www-data /var/lib/mutual-mentor/crm.db
chmod 600 /var/lib/mutual-mentor/crm.db

# Start application
pm2 start mutual-mentor
```

---

## Troubleshooting

### Application Won't Start

1. Check Node.js version:
```bash
node --version  # Should be 18.x or 20.x
```

2. Check for missing dependencies:
```bash
cd /opt/mutual-mentor/server
npm install
```

3. Verify environment file:
```bash
cat .env  # Check all required variables are set
```

4. Check port availability:
```bash
lsof -i :3001  # See if port is in use
```

### Database Errors

1. Check file permissions:
```bash
ls -la /var/lib/mutual-mentor/crm.db
# Should be owned by the Node.js process user
```

2. Check disk space:
```bash
df -h /var/lib/mutual-mentor/
```

3. Verify database integrity:
```bash
sqlite3 /var/lib/mutual-mentor/crm.db "PRAGMA integrity_check;"
```

### Authentication Issues

1. Verify JWT_SECRET is set:
```bash
grep JWT_SECRET .env
```

2. Check token format in requests:
```bash
# Should be: Authorization: Bearer <token>
```

3. Check for clock skew (affects token expiration):
```bash
date  # Verify system time is correct
```

### CORS Errors

1. Verify FRONTEND_URL matches exactly:
```bash
grep FRONTEND_URL .env
# Must match the URL in the browser address bar exactly
```

2. Check nginx proxy headers are correct

### Performance Issues

1. Check database size:
```bash
ls -lh /var/lib/mutual-mentor/crm.db
```

2. Optimize database:
```bash
sqlite3 /var/lib/mutual-mentor/crm.db "VACUUM; ANALYZE;"
```

3. Check memory usage:
```bash
pm2 monit
```

---

## Compliance

### GLBA Compliance

Mutual Mentor implements:
- Strong authentication (12+ character passwords)
- Role-based access (users only see their data)
- Audit logging (all API access logged)
- Encryption at rest (when server uses encrypted storage)
- Encryption in transit (HTTPS required)

### SOC 2 Compliance

| Control | Implementation |
|---------|----------------|
| Access Control | JWT authentication, password requirements |
| Logging & Monitoring | Comprehensive audit logs |
| Data Isolation | User-scoped database queries |
| Change Management | Version controlled code |

### FINRA Compliance

- Client PII protected by access controls
- Audit trail for all data modifications
- Data retention policies configurable
- Export capabilities for regulatory requests

### Audit Log Retention

By default, audit logs are retained indefinitely. To implement retention:

```bash
# Delete audit logs older than 7 years (FINRA requirement)
sqlite3 /var/lib/mutual-mentor/crm.db \
  "DELETE FROM audit_logs WHERE created_at < datetime('now', '-7 years');"
```

---

## Maintenance

### Updating the Application

```bash
# Stop application
pm2 stop mutual-mentor

# Backup database
cp /var/lib/mutual-mentor/crm.db /var/backups/crm_pre_update_$(date +%Y%m%d).db

# Pull updates
cd /opt/mutual-mentor
git pull

# Update dependencies
cd server && npm install --production
cd ../client && npm install && npm run build

# Start application
pm2 start mutual-mentor
```

### Running Tests

```bash
cd /opt/mutual-mentor/server
npm test
```

Test categories:
- Authentication tests
- API endpoint tests
- Security control tests
- Data isolation tests

### Log Rotation

Create `/etc/logrotate.d/mutual-mentor`:

```
/var/log/mutual-mentor/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### SSL Certificate Renewal

If using Let's Encrypt:

```bash
# Test renewal
certbot renew --dry-run

# Manual renewal
certbot renew

# Reload nginx
systemctl reload nginx
```

---

## Appendix

### Systemd Service File

Create `/etc/systemd/system/mutual-mentor.service`:

```ini
[Unit]
Description=Mutual Mentor CRM
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/mutual-mentor/server
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
systemctl daemon-reload
systemctl enable mutual-mentor
systemctl start mutual-mentor
```

### Useful Commands

```bash
# Check service status
systemctl status mutual-mentor

# View logs
journalctl -u mutual-mentor -f

# Restart service
systemctl restart mutual-mentor

# Check database
sqlite3 /var/lib/mutual-mentor/crm.db ".tables"
```

---

*Last Updated: December 2024*
*Version: 1.0*
