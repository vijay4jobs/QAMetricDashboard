# 🚀 Quick Deployment Guide

## Render.com (Easiest - Recommended)

### Step 1: Prepare Repository
```bash
# Ensure all changes are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Connect your repository

### Step 3: Create PostgreSQL Database
1. Click "New +" → "PostgreSQL"
2. Name: `qa-metrics-db`
3. Region: Choose closest to you
4. Plan: Free (or paid for production)
5. Click "Create Database"
6. **Copy the Internal Database URL** (you'll need this)

### Step 4: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name:** `qa-metrics-dashboard`
   - **Region:** Same as database
   - **Branch:** `main`
   - **Root Directory:** (leave empty)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### Step 5: Set Environment Variables
In the Web Service settings, add:

```
NODE_ENV=production
DATABASE_URL=<paste-internal-database-url-from-step-3>
JWT_SECRET=<generate-strong-secret>
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 6: Deploy
1. Click "Create Web Service"
2. Wait for build to complete (~2-3 minutes)
3. Your app will be live at: `https://qa-metrics-dashboard.onrender.com`

### Step 7: Run Migrations
1. Go to your Web Service dashboard
2. Click "Shell" tab
3. Run: `npm run migrate`

### Step 8: Access Your App
- Visit your Render URL
- Login with default admin: `admin` / `admin123`
- **Change admin password immediately!**

---

## Railway.app (Alternative)

### Step 1: Sign Up
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### Step 2: Create Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository

### Step 3: Add PostgreSQL
1. Click "+ New" → "Database" → "Add PostgreSQL"
2. Railway automatically sets `DATABASE_URL`

### Step 4: Set Environment Variables
In project settings → Variables, add:

```
NODE_ENV=production
JWT_SECRET=<generate-strong-secret>
```

### Step 5: Deploy
1. Railway auto-detects Node.js
2. Deploys automatically
3. Get your URL from the service

### Step 6: Run Migrations
1. Click on your service
2. Go to "Deployments" tab
3. Click "View Logs"
4. In terminal, run: `npm run migrate`

---

## Docker Deployment

### Step 1: Create .env file
```env
NODE_ENV=production
DATABASE_URL=postgres://qa_user:yourpassword@db:5432/qametrics
JWT_SECRET=your-strong-secret-here
DB_PASSWORD=your-db-password
PORT=3000
```

### Step 2: Build and Run
```bash
docker-compose up -d
```

### Step 3: Run Migrations
```bash
docker-compose exec app npm run migrate
```

### Step 4: Access
- App: http://localhost:3000
- Database: localhost:5432

---

## VPS/Server Deployment (Ubuntu)

### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2
```

### Step 2: Clone Repository
```bash
cd /var/www
sudo git clone <your-repo-url> qa-metrics
cd qa-metrics
sudo npm install --production
```

### Step 3: Setup Database
```bash
sudo -u postgres psql
CREATE DATABASE qametrics;
CREATE USER qa_user WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE qametrics TO qa_user;
\q
```

### Step 4: Configure Environment
```bash
sudo nano .env
```

Add:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://qa_user:strong_password@localhost:5432/qametrics
JWT_SECRET=<your-secret>
```

### Step 5: Run Migrations
```bash
npm run migrate
```

### Step 6: Start with PM2
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Follow instructions
```

### Step 7: Setup Nginx
```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/qa-metrics
```

Add:
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

```bash
sudo ln -s /etc/nginx/sites-available/qa-metrics /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: SSL with Let's Encrypt
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Post-Deployment Checklist

- [ ] Change default admin password
- [ ] Verify HTTPS is working
- [ ] Test all major features
- [ ] Check database backups
- [ ] Monitor logs for errors
- [ ] Set up monitoring alerts
- [ ] Document your deployment URL

---

## Troubleshooting

**App won't start:**
- Check environment variables
- Verify database connection
- Review application logs

**Database errors:**
- Verify DATABASE_URL format
- Check database is running
- Ensure migrations ran successfully

**Can't access app:**
- Check firewall rules
- Verify port is open
- Check reverse proxy configuration

---

**Need help?** Check `DEPLOYMENT_PLAN.md` for detailed information.

