-- Metric Definitions Table
CREATE TABLE IF NOT EXISTS metric_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('HTB', 'LTB')),
  description TEXT,
  is_active INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default metrics
INSERT OR IGNORE INTO metric_definitions (metric_key, name, unit, direction, description, display_order) VALUES
('test_design_productivity', 'Test Design Productivity', 'TC/PD', 'HTB', 'Number of test cases designed per person day', 1),
('test_execution_productivity', 'Test Execution Productivity', 'TC/PD', 'HTB', 'Test cases executed per person day', 2),
('test_design_coverage', 'Test Design Coverage', '%', 'HTB', 'Percentage of requirements mapped to test cases', 3),
('test_execution_coverage', 'Test Execution Coverage', '%', 'HTB', 'Percentage of test cases executed', 4),
('test_environment_availability', 'Test Environment Availability', '%', 'HTB', 'Percentage of environment uptime', 5),
('defect_rejection', 'Defect Rejection', '%', 'LTB', 'Percentage of defects rejected', 6),
('effort_variation', 'Effort Variation', '%', 'LTB', 'Variance between estimated and actual effort', 7),
('effort_per_story_point', 'Effort Per Story Point', 'PHrs / Story Point', 'LTB', 'Hours spent per story point', 8),
('automation_coverage', 'Automation Coverage', '%', 'HTB', 'Percentage of test cases automated', 9),
('schedule_variation', 'Schedule Variation', '%', 'LTB', 'Variance between planned and actual schedule', 10),
('requirements_traceability', 'Requirements Traceability', '%', 'HTB', 'Percentage of requirements traced to test cases', 11),
('on_time_completion_milestones', 'On Time Completion of Milestones', '%', 'HTB', 'Percentage of milestones completed on time', 12);

