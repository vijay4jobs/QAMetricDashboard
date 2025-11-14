-- Add unique constraint to project names to prevent duplicates
-- SQLite doesn't support ADD CONSTRAINT directly, so we need to recreate the table

-- Create new table with unique constraint
CREATE TABLE IF NOT EXISTS projects_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy data from old table, keeping only the first occurrence of each project name
INSERT INTO projects_new (id, name, created_at)
SELECT MIN(id) as id, name, MIN(created_at) as created_at
FROM projects
GROUP BY name;

-- Drop old table
DROP TABLE IF EXISTS projects;

-- Rename new table
ALTER TABLE projects_new RENAME TO projects;

