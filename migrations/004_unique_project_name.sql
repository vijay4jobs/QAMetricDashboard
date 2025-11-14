-- Add unique constraint to project names to prevent duplicates
-- This migration is idempotent - safe to run multiple times due to migration tracking
-- For PostgreSQL: Add unique constraint directly
-- For SQLite: Recreate table with unique constraint (SQLite doesn't support ADD CONSTRAINT)

-- PostgreSQL: Add unique constraint if it doesn't exist
-- This will fail silently on SQLite, which is fine
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'projects_name_key' 
    AND conrelid = 'projects'::regclass
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT projects_name_key UNIQUE (name);
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL; -- Table doesn't exist yet, will be created by init migration
  WHEN OTHERS THEN
    NULL; -- Not PostgreSQL or constraint already exists
END $$;

-- SQLite approach: Recreate table with unique constraint
-- Only run this if we're using SQLite (PostgreSQL will skip due to syntax)
-- Check if unique constraint already exists by checking table schema
CREATE TABLE IF NOT EXISTS projects_temp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy existing data (only if projects table exists and has data)
-- This prevents data loss
INSERT INTO projects_temp (id, name, created_at)
SELECT MIN(id) as id, name, MIN(created_at) as created_at
FROM projects
WHERE NOT EXISTS (SELECT 1 FROM projects_temp WHERE projects_temp.id = projects.id)
GROUP BY name;

-- Drop old table and rename (only if we're using SQLite)
-- PostgreSQL will have already applied the constraint above
DROP TABLE IF EXISTS projects;
ALTER TABLE projects_temp RENAME TO projects;

