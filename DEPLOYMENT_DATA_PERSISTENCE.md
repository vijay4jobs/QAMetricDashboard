# 🔒 Preventing Data Loss on Deployment

## Problem
Data is lost every time you deploy because:
1. Migrations run on every container start
2. No migration tracking system
3. Database URL might be changing

## ✅ Solution Implemented

### 1. Migration Tracking System
- Migrations now track which ones have been applied
- Only new migrations run on subsequent deploys
- Prevents duplicate execution and data loss

### 2. Updated Migration Script
- `scripts/runMigrations.js` now checks `schema_migrations` table
- Skips already-applied migrations
- Safe to run multiple times

### 3. Dockerfile Updated
- Removed automatic migration execution on container start
- Migrations must be run manually or via deployment script
- Prevents accidental data loss

## 🚀 Deployment Steps (IMPORTANT)

### For Render.com:

1. **First Time Setup:**
   ```bash
   # In Render Shell, run:
   npm run migrate
   ```

2. **On Subsequent Deploys:**
   - Migrations will automatically skip already-applied ones
   - Only new migrations will run
   - Your data will be preserved

3. **Verify DATABASE_URL:**
   - Go to Render Dashboard → Your Web Service → Environment
   - Ensure `DATABASE_URL` is set and **never changes**
   - If it changes, you'll connect to a different (empty) database

### For Railway.app:

1. **First Time Setup:**
   - Railway auto-runs migrations if configured
   - Or run manually: `railway run npm run migrate`

2. **Ensure DATABASE_URL Persists:**
   - Check Railway project settings
   - Database service should be linked to your app
   - `DATABASE_URL` should be automatically set

### For Docker:

1. **First Time:**
   ```bash
   docker-compose up -d
   docker-compose exec app npm run migrate
   ```

2. **On Updates:**
   ```bash
   docker-compose up -d --build
   # Migrations will only run new ones automatically
   ```

## ⚠️ Critical Checks

### 1. Verify DATABASE_URL Persistence
```bash
# In your deployment platform, check:
echo $DATABASE_URL
# Should be the SAME every time
```

### 2. Check Migration Status
```sql
-- Connect to your PostgreSQL database
SELECT * FROM schema_migrations ORDER BY applied_at;
-- Should show all applied migrations
```

### 3. Backup Before Major Changes
```bash
# Render: Use Render's backup feature
# Railway: Export database
# Manual: pg_dump
pg_dump $DATABASE_URL > backup.sql
```

## 🔍 Troubleshooting

### Data Still Being Lost?

1. **Check DATABASE_URL:**
   - Is it changing between deploys?
   - Is it pointing to the correct database?

2. **Check Migration Tracking:**
   ```sql
   SELECT * FROM schema_migrations;
   ```
   - If empty, migrations aren't being tracked
   - Run migrations manually: `npm run migrate`

3. **Check Database Service:**
   - Is your database service persistent?
   - Free tiers might reset databases
   - Consider upgrading to a persistent plan

### Migration Errors?

1. **If migration fails:**
   - Check logs for specific error
   - Migration script will continue with other migrations
   - Fix the issue and re-run: `npm run migrate`

2. **If migration tracking is lost:**
   - Don't panic - migrations use `IF NOT EXISTS`
   - Re-run migrations - they'll skip already-applied ones
   - Check `schema_migrations` table after

## 📝 Best Practices

1. **Always backup before major deployments**
2. **Test migrations locally first**
3. **Use environment-specific databases** (dev/staging/prod)
4. **Monitor migration logs** during deployment
5. **Keep DATABASE_URL in environment variables** (never hardcode)

## 🎯 Summary

- ✅ Migrations now track execution
- ✅ Only new migrations run on deploy
- ✅ Data is preserved between deployments
- ⚠️ **Ensure DATABASE_URL never changes**
- ⚠️ **Run migrations manually on first deploy**

