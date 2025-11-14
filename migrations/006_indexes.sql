-- calculated metrics fast lookup by project/metric/period
CREATE INDEX IF NOT EXISTS idx_calculated_metrics_project_metric_period
  ON calculated_metrics (project_id, metric_key, period_start);

-- metric inputs lookup by project/period
CREATE INDEX IF NOT EXISTS idx_metric_inputs_project_period
  ON metric_inputs (project_id, period_start);

-- sessions fast lookup
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (session_token);

-- users fast lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);


