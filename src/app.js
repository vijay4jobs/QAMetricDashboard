import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import metricsRouter from './routes/metrics.js';
import projectsRouter from './routes/projects.js';
// Unused routes - kept for future use
// import testRunsRouter from './routes/testRuns.js';
// import defectsRouter from './routes/defects.js';
// import metricTargetsRouter from './routes/metricTargets.js';
import metricInputsRouter from './routes/metricInputs.js';
import XLSX from 'xlsx';
import adminRouter from './routes/admin.js';
import { login, register, logout, authMiddleware, requireRole } from './auth.js';

dotenv.config();
const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../public')));

// Public routes
app.post('/api/auth/login', login);
app.post('/api/auth/register', register);
app.post('/api/auth/logout', authMiddleware, logout);

// Public template download (no auth required)
app.get('/api/metric-inputs/template', (req, res) => {
  try {
    const format = (req.query.format || 'xlsx').toLowerCase();
    const REQUIRED_COLUMNS = [
      'project_id', 'period_start', 'period_end',
      'test_cases_designed', 'effort_design_review_rework',
      'test_cases_executed_productivity', 'effort_execution',
      'testable_reqs_mapped_to_tc', 'baselined_testable_reqs',
      'test_cases_executed', 'test_cases_planned',
      'person_days_lost_downtime', 'planned_effort_person_days',
      'defects_rejected', 'valid_defects_raised',
      'actual_effort_closed', 'estimated_effort_closed',
      'actual_effort_hours', 'story_points_accepted_effort',
      'automated_test_cases', 'total_test_cases',
      'actual_end_date_days', 'planned_end_date_days',
      'requirements_mapped_to_tc', 'total_requirements',
      'milestones_completed_ontime', 'total_milestones'
    ];

    const ws = XLSX.utils.aoa_to_sheet([REQUIRED_COLUMNS]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MetricInputs');

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      res.setHeader('Content-Disposition', 'attachment; filename=\"metric_inputs_template.csv\"');
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csv);
    }

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=\"metric_inputs_template.xlsx\"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buf);
  } catch (e) {
    console.error('Template generation error:', e);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// Protected routes - Authenticated users (role-based inside router)
app.use('/api/admin', authMiddleware, adminRouter);

// Public routes (can be protected later by uncommenting authMiddleware)
// app.use('/api', authMiddleware); // Uncomment to require auth for all API routes
app.use('/api/metrics', metricsRouter);
app.use('/api/projects', projectsRouter);
// Unused routes - kept for future use
// app.use('/api/test-runs', testRunsRouter);
// app.use('/api/defects', defectsRouter);
// app.use('/api/metric-targets', metricTargetsRouter);
app.use('/api/metric-inputs', authMiddleware, metricInputsRouter);

app.get('/api/health', (req,res)=> res.json({ status: 'ok'}));

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log(`Server http://localhost:${port}`));
