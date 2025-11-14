# 🚀 Deployment Plan - QA Metrics Dashboard

This document outlines a comprehensive plan to deploy the QA Metrics Dashboard to production.

## 📋 Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Security Hardening](#security-hardening)
4. [Database Setup](#database-setup)
5. [Deployment Platforms](#deployment-platforms)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Rollback Plan](#rollback-plan)

---

## ✅ Pre-Deployment Checklist

### Code Readiness
- [x] All code committed and pushed to repository
- [x] Dependencies cleaned up and documented
- [x] Unused code removed
- [ ] Environment variables documented
- [ ] Error handling tested
- [ ] Security vulnerabilities scanned

### Database
- [ ] Migration scripts tested
- [ ] Backup strategy defined
- [ ] Database connection tested (PostgreSQL)
- [ ] Initial data seeding plan ready

### Security
- [ ] Strong JWT_SECRET generated
- [ ] Default admin password changed
- [ ] HTTPS/SSL certificate ready
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] Security headers configured

---

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env` file for production:

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Database (PostgreSQL for production)
DATABASE_URL=postgres://username:password@host:5432/dbname

# Security (CRITICAL - Generate strong secret)
JWT_SECRET=<generate-strong-random-secret-here>

# Optional: Logging
LOG_LEVEL=info
```

### Generate JWT Secret

```bash
# Generate a strong random secret (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Node.js Version

Ensure Node.js 18+ is installed:
```bash
node --version  # Should be 18.x or higher
```

---

## 🔒 Security Hardening

### 1. Add Security Middleware

Create `src/middleware/security.js`:

```javascript
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://unpkg.com", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// CORS configuration
export const corsConfig = cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Rate limiting
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiting (stricter)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});
```

### 2. Update package.json

Add security dependencies:
```json
{
  "dependencies": {
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5"
  }
}
```

### 3. Update src/app.js

```javascript
import { securityHeaders, corsConfig, rateLimiter, authRateLimiter } from './middleware/security.js';

// Apply security middleware
app.use(securityHeaders);
app.use(corsConfig);
app.use(rateLimiter);

// Stricter rate limiting for auth routes
app.use('/api/auth', authRateLimiter);
```

---

## 💾 Database Setup

### Option 1: PostgreSQL (Recommended for Production)

#### Using Managed Database Services:

**Render PostgreSQL:**
1. Create PostgreSQL database in Render dashboard
2. Copy connection string
3. Set as `DATABASE_URL` environment variable

**Railway PostgreSQL:**
1. Add PostgreSQL service
2. Copy connection string from service variables
3. Set as `DATABASE_URL`

**Supabase:**
1. Create new project
2. Get connection string from Settings > Database
3. Format: `postgres://postgres:[PASSWORD]@[HOST]:5432/postgres`

#### Manual PostgreSQL Setup:

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE qa_metrics;
CREATE USER qa_user WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE qa_metrics TO qa_user;
\q
```

### Option 2: SQLite (Development Only)

⚠️ **Not recommended for production** - Use only for development/testing.

```bash
# SQLite file will be created automatically
# Ensure write permissions on directory
chmod 755 .
```

### Run Migrations

```bash
# Set DATABASE_URL first
export DATABASE_URL="postgres://user:pass@host:5432/dbname"

# Run migrations
npm run migrate

# Optional: Seed initial data
npm run seed
```

---

## 🌐 Deployment Platforms

### Option 1: Render (Recommended - Easiest)

**Steps:**
1. Sign up at [render.com](https://render.com)
2. Connect GitHub repository
3. Create new Web Service
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Add Environment Variables:
   - `NODE_ENV=production`
   - `PORT=3000` (auto-set by Render)
   - `DATABASE_URL=<your-postgres-url>`
   - `JWT_SECRET=<your-secret>`
6. Create PostgreSQL database (separate service)
7. Link database to web service
8. Deploy

**Pros:**
- Free tier available
- Automatic SSL/HTTPS
- Easy PostgreSQL integration
- Auto-deploy from Git

**Cons:**
- Free tier spins down after inactivity
- Limited customization

---

### Option 2: Railway

**Steps:**
1. Sign up at [railway.app](https://railway.app)
2. New Project > Deploy from GitHub
3. Add PostgreSQL service
4. Set environment variables:
   - `DATABASE_URL` (auto-set from PostgreSQL service)
   - `JWT_SECRET`
   - `NODE_ENV=production`
5. Deploy

**Pros:**
- Simple setup
- Good free tier
- Auto-detects Node.js
- Integrated PostgreSQL

**Cons:**
- Limited free tier resources

---

### Option 3: DigitalOcean App Platform

**Steps:**
1. Create account at [digitalocean.com](https://digitalocean.com)
2. Create App > GitHub
3. Configure:
   - Build: `npm install`
   - Run: `npm start`
4. Add Managed Database (PostgreSQL)
5. Set environment variables
6. Deploy

**Pros:**
- Reliable infrastructure
- Good performance
- Managed databases

**Cons:**
- Paid service (starts at $5/month)

---

### Option 4: AWS (EC2/Elastic Beanstalk)

**Steps:**
1. Launch EC2 instance (Ubuntu 22.04)
2. Install Node.js 18+
3. Clone repository
4. Set up PostgreSQL (RDS or EC2)
5. Configure environment variables
6. Set up PM2 or systemd service
7. Configure Nginx reverse proxy
8. Set up SSL with Let's Encrypt

**Detailed AWS Setup:**

```bash
# On EC2 instance
sudo apt update
sudo apt install -y nodejs npm postgresql-client

# Install Node.js 18+ using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Clone and setup
git clone <your-repo-url>
cd QAMetricDashboard
npm install --production

# Install PM2 for process management
npm install -g pm2

# Create ecosystem file: ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'qa-metrics',
    script: 'src/app.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

**Start with PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### Option 5: Docker Deployment

**Create Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Run migrations and start
CMD ["sh", "-c", "npm run migrate && npm start"]
```

**Create docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://user:pass@db:5432/qametrics
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=qametrics
      - POSTGRES_USER=qa_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

**Deploy:**
```bash
docker-compose up -d
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests (if you have them)
      run: npm test || true
    
    - name: Deploy to Render
      env:
        RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
        RENDER_SERVICE_ID: ${{ secrets.RENDER_SERVICE_ID }}
      run: |
        curl -X POST "https://api.render.com/deploy/srv/$RENDER_SERVICE_ID" \
          -H "Authorization: Bearer $RENDER_API_KEY"
    
    # Or deploy to Railway
    - name: Deploy to Railway
      uses: bervProject/railway-deploy@v1.0.0
      with:
        railway_token: ${{ secrets.RAILWAY_TOKEN }}
        service: ${{ secrets.RAILWAY_SERVICE }}
```

---

## 📊 Monitoring & Maintenance

### 1. Health Check Endpoint

Already implemented: `GET /api/health`

### 2. Logging

Add structured logging:

```javascript
// src/utils/logger.js
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### 3. Error Tracking

Consider integrating:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **New Relic** for APM

### 4. Database Backups

**Automated Backup Script:**

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="qa_metrics"

# PostgreSQL backup
pg_dump $DATABASE_URL > "$BACKUP_DIR/backup_$DATE.sql"

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

# Upload to S3 (optional)
# aws s3 cp "$BACKUP_DIR/backup_$DATE.sql" s3://your-bucket/backups/
```

**Schedule with cron:**
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### 5. Performance Monitoring

- Monitor response times
- Track database query performance
- Set up alerts for errors
- Monitor disk space and memory usage

---

## 🔙 Rollback Plan

### Quick Rollback Steps

1. **Revert to previous Git commit:**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Database rollback:**
   ```bash
   # Restore from backup
   psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
   ```

3. **Platform-specific rollback:**
   - **Render/Railway:** Use deployment history to rollback
   - **Docker:** Revert to previous image tag
   - **PM2:** `pm2 restart qa-metrics --update-env`

### Pre-Rollback Checklist

- [ ] Backup current database
- [ ] Document current version
- [ ] Test rollback in staging
- [ ] Notify users if needed

---

## 📝 Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Verify all endpoints working
- [ ] Test authentication flow
- [ ] Check database connections
- [ ] Verify SSL/HTTPS
- [ ] Test file uploads
- [ ] Monitor error logs

### Week 1
- [ ] Review access logs
- [ ] Check performance metrics
- [ ] Verify backups running
- [ ] Update documentation
- [ ] Gather user feedback

### Ongoing
- [ ] Weekly backup verification
- [ ] Monthly security updates
- [ ] Quarterly dependency updates
- [ ] Monitor for security vulnerabilities

---

## 🆘 Troubleshooting

### Common Issues

**Application won't start:**
- Check environment variables
- Verify database connection
- Check port availability
- Review application logs

**Database connection errors:**
- Verify DATABASE_URL format
- Check database credentials
- Ensure database is accessible
- Check firewall rules

**Authentication issues:**
- Verify JWT_SECRET is set
- Check token expiration
- Review session cleanup
- Check user roles in database

---

## 📞 Support Resources

- **Application Logs:** Check platform logs or `pm2 logs`
- **Database Logs:** Check PostgreSQL logs
- **Error Tracking:** Sentry/LogRocket dashboard
- **Documentation:** README.md, AUTHENTICATION_GUIDE.md

---

## 🎯 Next Steps

1. **Choose deployment platform** based on your needs
2. **Set up environment variables** in chosen platform
3. **Create PostgreSQL database** (managed or self-hosted)
4. **Run migrations** on production database
5. **Deploy application** using chosen method
6. **Configure monitoring** and alerts
7. **Set up automated backups**
8. **Test thoroughly** before going live
9. **Document** any platform-specific configurations

---

**Last Updated:** $(date)
**Version:** 1.0.0

