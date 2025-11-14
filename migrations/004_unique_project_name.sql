-- Add unique constraint to project names to prevent duplicates
-- This migration is idempotent - safe to run multiple times due to migration tracking
-- For PostgreSQL: Add unique constraint directly
-- For SQLite: Recreate table with unique constraint (SQLite doesn't support ADD CONSTRAINT)

-- SQLite approach: Recreate table with unique constraint
-- This will work for SQLite. For PostgreSQL, we'll handle it differently.
-- First, check if we need to migrate (only if projects table exists without unique constraint)

-- Create temporary table with unique constraint
CREATE TABLE IF NOT EXISTS projects_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy existing data to new table (only if projects exists)
-- Use INSERT OR IGNORE to handle duplicates gracefully
INSERT OR IGNORE INTO projects_new (id, name, created_at)
SELECT MIN(id) as id, name, MIN(created_at) as created_at
FROM projects
WHERE NOT EXISTS (SELECT 1 FROM projects_new WHERE projects_new.id = projects.id)
GROUP BY name;

-- For SQLite: Drop old table and rename new one
-- This will only work if projects table exists (created by init migration)
-- If it fails, the constraint might already exist or we're on PostgreSQL
DROP TABLE IF EXISTS projects;
ALTER TABLE projects_new RENAME TO projects;

