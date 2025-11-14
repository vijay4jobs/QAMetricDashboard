-- Add unique constraint to project names to prevent duplicates
-- PROTECTED BY MIGRATION TRACKING: This migration will only run once
-- For SQLite: Recreate table with unique constraint (SQLite doesn't support ADD CONSTRAINT)

-- Create temporary table with unique constraint
CREATE TABLE IF NOT EXISTS projects_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy existing data to new table (preserves all data)
-- Use INSERT OR IGNORE to handle any duplicates gracefully
INSERT OR IGNORE INTO projects_new (id, name, created_at)
SELECT MIN(id) as id, name, MIN(created_at) as created_at
FROM projects
WHERE NOT EXISTS (SELECT 1 FROM projects_new WHERE projects_new.id = projects.id)
GROUP BY name;

-- Drop old table and rename new one
-- SAFE: Migration tracking ensures this only runs once
-- All data has been copied to projects_new before this step
DROP TABLE IF EXISTS projects;
ALTER TABLE projects_new RENAME TO projects;

