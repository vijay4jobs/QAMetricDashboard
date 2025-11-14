-- Schema initialization
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Unused tables - kept for future use
-- API routes for these tables are commented out in src/app.js
CREATE TABLE IF NOT EXISTS test_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  executed_by TEXT,
  executed_at DATETIME,
  duration_minutes INTEGER,
  status TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS defects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  source TEXT,
  severity TEXT,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS metric_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  period_start DATETIME,
  period_end DATETIME,
  target_ddr REAL,
  target_coverage REAL,
  max_exec_time_min INTEGER,
  max_regression_failures INTEGER,
  max_blocked_tests INTEGER,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

