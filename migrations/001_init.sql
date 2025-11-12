-- Schema initialization
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

-- Simple coverage placeholder table (optional)
CREATE TABLE IF NOT EXISTS coverage_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  period_start DATETIME,
  period_end DATETIME,
  requirements_covered INTEGER,
  requirements_total INTEGER,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);
