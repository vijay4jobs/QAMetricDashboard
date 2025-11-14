-- Metric inputs table to store raw data for calculations
CREATE TABLE IF NOT EXISTS metric_inputs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  period_start DATETIME,
  period_end DATETIME,
  
  -- Automation Coverage fields
  automated_test_cases INTEGER,
  total_test_cases INTEGER,
  
  -- Automation Coverage Functional/Progression
  automated_progression_test_cases INTEGER,
  total_progression_test_cases INTEGER,
  
  -- Automation Coverage Regression
  automated_regression_test_cases INTEGER,
  total_regression_test_cases INTEGER,
  
  -- Automation Defect Yield Regression
  regression_defects_automation INTEGER,
  total_regression_defects INTEGER,
  
  -- Automation Leverage
  automated_scripts_executed INTEGER,
  total_automated_scripts INTEGER,
  
  -- Automation Leverage Regression
  automated_regression_scripts_executed INTEGER,
  total_automated_regression_scripts INTEGER,
  
  -- Commitment Reliability
  story_points_accepted INTEGER,
  story_points_committed INTEGER,
  
  -- Defect Rejection
  defects_rejected INTEGER,
  valid_defects_raised INTEGER,
  
  -- Effort Per Story Point
  actual_effort_hours REAL,
  story_points_accepted_effort INTEGER,
  
  -- Effort Variation
  actual_effort_closed REAL,
  estimated_effort_closed REAL,
  
  -- NFR Test Coverage
  nfr_tested_delivered INTEGER,
  nfr_committed_baselined INTEGER,
  
  -- On Time Completion Milestones
  milestones_completed_ontime INTEGER,
  total_milestones INTEGER,
  
  -- On Time Delivery
  deliverables_completed_ontime INTEGER,
  total_deliverables_planned INTEGER,
  
  -- Requirements Traceability
  requirements_mapped_to_tc INTEGER,
  total_requirements INTEGER,
  
  -- Schedule Variation
  actual_end_date_days INTEGER,
  planned_end_date_days INTEGER,
  
  -- Story Point Productivity
  story_points_accepted_productivity INTEGER,
  overall_effort_productivity REAL,
  
  -- Test Design Coverage
  testable_reqs_mapped_to_tc INTEGER,
  baselined_testable_reqs INTEGER,
  
  -- Test Design Productivity
  test_cases_designed INTEGER,
  effort_design_review_rework REAL,
  
  -- Test Environment Availability
  person_days_lost_downtime INTEGER,
  planned_effort_person_days INTEGER,
  
  -- Test Execution Coverage
  test_cases_executed INTEGER,
  test_cases_planned INTEGER,
  
  -- Test Execution Coverage Regression
  regression_test_cases_executed INTEGER,
  regression_test_cases_planned INTEGER,
  
  -- Test Execution Productivity
  test_cases_executed_productivity INTEGER,
  effort_execution REAL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

-- Calculated metrics table
CREATE TABLE IF NOT EXISTS calculated_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  period_start DATETIME,
  period_end DATETIME,
  metric_key TEXT NOT NULL,
  metric_value REAL,
  unit TEXT,
  direction TEXT,
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id),
  UNIQUE(project_id, period_start, period_end, metric_key)
);

