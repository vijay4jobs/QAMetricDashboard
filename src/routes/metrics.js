import express from 'express';

const router = express.Router();

const METRIC_CATALOG = [
  {
    key: 'test_design_productivity',
    name: 'Test Design Productivity',
    unit: 'TC/PD',
    indicator: 'HTB',
    definition: 'Number of test cases designed / Effort spent for creation, review, rework of test scenario and test cases'
  },
  {
    key: 'test_execution_productivity',
    name: 'Test Execution Productivity',
    unit: 'TC/PD',
    indicator: 'HTB',
    definition: 'Test cases or test scripts executed / Effort spent for test case or test script execution'
  },
  {
    key: 'test_design_coverage',
    name: 'Test Design Coverage',
    unit: '%',
    indicator: 'HTB',
    definition: 'Total number of testable requirements mapped to test cases / Total number of baselined testable requirements * 100'
  },
  {
    key: 'test_execution_coverage',
    name: 'Test Execution Coverage',
    unit: '%',
    indicator: 'HTB',
    definition: 'Number of unique test cases or steps executed / Number of unique test cases or steps * 100'
  },
  {
    key: 'test_environment_availability',
    name: 'Test Environment Availability',
    unit: '%',
    indicator: 'HTB',
    definition: 'Number of person days lost due to environment downtime by planned effort (in person days) for test team'
  },
  {
    key: 'defect_rejection',
    name: 'Defect Rejection',
    unit: '%',
    indicator: 'LTB',
    definition: 'Total number of defects rejected by development team or customers / Number of valid defects raised'
  },
  {
    key: 'effort_variation',
    name: 'Effort Variation',
    unit: '%',
    indicator: 'LTB',
    definition: '(Actual effort of closed tasks - Estimated effort of closed tasks) / Estimated effort of closed tasks * 100'
  },
  {
    key: 'effort_per_story_point',
    name: 'Effort Per Story Point',
    unit: 'PHrs / Story Point',
    indicator: 'LTB',
    definition: 'Actual effort / Number of story points accepted in a sprint'
  },
  {
    key: 'automation_coverage',
    name: 'Automation Coverage',
    unit: '%',
    indicator: 'HTB',
    definition: 'Number of unique automated test cases / Number of unique test cases'
  },
  {
    key: 'schedule_variation',
    name: 'Schedule Variation',
    unit: '%',
    indicator: 'LTB',
    definition: '(Actual end date of closed tasks - Planned end date of closed tasks) / Planned end date of closed tasks * 100'
  },
  {
    key: 'requirements_traceability',
    name: 'Requirements Traceability',
    unit: '%',
    indicator: 'HTB',
    definition: 'Number of requirements mapped to test cases / Total number of requirements * 100'
  },
  {
    key: 'on_time_completion_milestones',
    name: 'On Time Completion of Milestones or Deliverables',
    unit: '%',
    indicator: 'HTB',
    definition: 'Number of milestones or deliverables completed on time / Total number of milestones or deliverables * 100'
  }
];

router.get('/catalog', (req, res) => {
  res.json(METRIC_CATALOG);
});

export default router;
