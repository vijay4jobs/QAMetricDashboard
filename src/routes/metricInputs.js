import express from 'express';
import { getDb } from '../db.js';
import multer from 'multer';
import XLSX from 'xlsx';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const okTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv',
      'text/plain'
    ];
    if (okTypes.includes(file.mimetype)) return cb(null, true);
    const err = new Error('Unsupported file type');
    // @ts-ignore attach metadata
    err.status = 400;
    // @ts-ignore
    err.code = 'BAD_FILE_TYPE';
    return cb(err);
  }
});

// Save metric inputs and calculate metrics
router.post('/', async (req, res) => {
  const db = await getDb();
  const {
    projectId, periodStart, periodEnd,
    // Test Design Productivity
    test_cases_designed, effort_design_review_rework,
    // Test Execution Productivity
    test_cases_executed_productivity, effort_execution,
    // Test Design Coverage
    testable_reqs_mapped_to_tc, baselined_testable_reqs,
    // Test Execution Coverage
    test_cases_executed, test_cases_planned,
    // Test Environment Availability
    person_days_lost_downtime, planned_effort_person_days,
    // Defect Rejection
    defects_rejected, valid_defects_raised,
    // Effort Variation
    actual_effort_closed, estimated_effort_closed,
    // Effort Per Story Point
    actual_effort_hours, story_points_accepted_effort,
    // Automation Coverage
    automated_test_cases, total_test_cases,
    // Schedule Variation
    actual_end_date_days, planned_end_date_days,
    // Requirements Traceability
    requirements_mapped_to_tc, total_requirements,
    // On Time Completion of Milestones or Deliverables
    milestones_completed_ontime, total_milestones
  } = req.body;

  if (!projectId || !periodStart || !periodEnd) {
    return res.status(400).json({ error: 'projectId, periodStart, and periodEnd are required' });
  }

  try {
    // Enforce project scope for non-admin users
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin) {
      if (!req.user?.projectId) {
        return res.status(403).json({ error: 'No project scope in session' });
      }
      if (Number(req.user.projectId) !== Number(projectId)) {
        return res.status(403).json({ error: 'Cannot submit data for a different project' });
      }
    }

    // Save input data (only fields for 12 metrics, in specified order)
    const inputResult = await db.run(`
      INSERT INTO metric_inputs (
        project_id, period_start, period_end,
        test_cases_designed, effort_design_review_rework,
        test_cases_executed_productivity, effort_execution,
        testable_reqs_mapped_to_tc, baselined_testable_reqs,
        test_cases_executed, test_cases_planned,
        person_days_lost_downtime, planned_effort_person_days,
        defects_rejected, valid_defects_raised,
        actual_effort_closed, estimated_effort_closed,
        actual_effort_hours, story_points_accepted_effort,
        automated_test_cases, total_test_cases,
        actual_end_date_days, planned_end_date_days,
        requirements_mapped_to_tc, total_requirements,
        milestones_completed_ontime, total_milestones
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      projectId, periodStart, periodEnd,
      test_cases_designed || null, effort_design_review_rework || null,
      test_cases_executed_productivity || null, effort_execution || null,
      testable_reqs_mapped_to_tc || null, baselined_testable_reqs || null,
      test_cases_executed || null, test_cases_planned || null,
      person_days_lost_downtime || null, planned_effort_person_days || null,
      defects_rejected || null, valid_defects_raised || null,
      actual_effort_closed || null, estimated_effort_closed || null,
      actual_effort_hours || null, story_points_accepted_effort || null,
      automated_test_cases || null, total_test_cases || null,
      actual_end_date_days || null, planned_end_date_days || null,
      requirements_mapped_to_tc || null, total_requirements || null,
      milestones_completed_ontime || null, total_milestones || null
    ]);

    const inputId = inputResult.lastID || inputResult.id;

    // Calculate all metrics
    const calculated = await calculateAllMetrics(db, projectId, periodStart, periodEnd);

    res.status(201).json({
      inputId,
      calculated,
      message: 'Metrics saved and calculated successfully'
    });
  } catch (error) {
    console.error('Error saving metric inputs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Calculate all metrics from latest input
async function calculateAllMetrics(db, projectId, periodStart, periodEnd) {
  const input = await db.get(`
    SELECT * FROM metric_inputs 
    WHERE project_id = ? AND period_start = ? AND period_end = ?
    ORDER BY created_at DESC LIMIT 1
  `, [projectId, periodStart, periodEnd]);

  if (!input) return {};

  const calculations = {};

  // 1. Test Design Productivity
  if (input.test_cases_designed != null && input.effort_design_review_rework != null && input.effort_design_review_rework > 0) {
    const value = input.test_cases_designed / input.effort_design_review_rework;
    await saveCalculatedMetric(db, projectId, periodStart, periodEnd, 'test_design_productivity', value, 'TC/PD', 'HTB');
    calculations.test_design_productivity = value;
  }

  // 2. Test Execution Productivity
  if (input.test_cases_executed_productivity != null && input.effort_execution != null && input.effort_execution > 0) {
    const value = input.test_cases_executed_productivity / input.effort_execution;
    await saveCalculatedMetric(db, projectId, periodStart, periodEnd, 'test_execution_productivity', value, 'TC/PD', 'HTB');
    calculations.test_execution_productivity = value;
  }

  // 3. Test Design Coverage
  if (input.testable_reqs_mapped_to_tc != null && input.baselined_testable_reqs != null && input.baselined_testable_reqs > 0) {
    const value = (input.testable_reqs_mapped_to_tc / input.baselined_testable_reqs) * 100;
    await saveCalculatedMetric(db, projectId, periodStart, periodEnd, 'test_design_coverage', value, '%', 'HTB');
    calculations.test_design_coverage = value;
  }

  // 4. Test Execution Coverage
  if (input.test_cases_executed != null && input.test_cases_planned != null && input.test_cases_planned > 0) {
    const value = (input.test_cases_executed / input.test_cases_planned) * 100;
    await saveCalculatedMetric(db, projectId, periodStart, periodEnd, 'test_execution_coverage', value, '%', 'HTB');
    calculations.test_execution_coverage = value;
  }

  // 5. Test Environment Availability
  if (input.person_days_lost_downtime != null && input.planned_effort_person_days != null && input.planned_effort_person_days > 0) {
    const value = (1 - (input.person_days_lost_downtime / input.planned_effort_person_days)) * 100;
    await saveCalculatedMetric(db, projectId, periodStart, periodEnd, 'test_environment_availability', value, '%', 'HTB');
    calculations.test_environment_availability = value;
  }

  // 6. Defect Rejection
  if (input.defects_rejected != null && input.valid_defects_raised != null && input.valid_defects_raised > 0) {
    const value = (input.defects_rejected / input.valid_defects_raised) * 100;
    await saveCalculatedMetric(db, projectId, periodStart, periodEnd, 'defect_rejection', value, '%', 'LTB');
    calculations.defect_rejection = value;
  }

  // 7. Effort Variation
  if (input.actual_effort_closed != null && input.estimated_effort_closed != null && input.estimated_effort_closed > 0) {
    const value = ((input.actual_effort_closed - input.estimated_effort_closed) / input.estimated_effort_closed) * 100;
    await saveCalculatedMetric(db, projectId, periodStart, periodEnd, 'effort_variation', value, '%', 'LTB');
    calculations.effort_variation = value;
  }

  // 8. Effort Per Story Point
  if (input.actual_effort_hours != null && input.story_points_accepted_effort != null && input.story_points_accepted_effort > 0) {
    const value = input.actual_effort_hours / input.story_points_accepted_effort;
    await saveCalculatedMetric(db, projectId, periodStart, periodEnd, 'effort_per_story_point', value, 'PHrs / Story Point', 'LTB');
    calculations.effort_per_story_point = value;
  }

  // 9. Automation Coverage
  if (input.automated_test_cases != null && input.total_test_cases != null && input.total_test_cases > 0) {
    const value = (input.automated_test_cases / input.total_test_cases) * 100;
    await saveCalculatedMetric(db, projectId, periodStart, periodEnd, 'automation_coverage', value, '%', 'HTB');
    calculations.automation_coverage = value;
  }

  // 10. Schedule Variation
  if (input.actual_end_date_days != null && input.planned_end_date_days != null && input.planned_end_date_days > 0) {
    const value = ((input.actual_end_date_days - input.planned_end_date_days) / input.planned_end_date_days) * 100;
    await saveCalculatedMetric(db, projectId, periodStart, periodEnd, 'schedule_variation', value, '%', 'LTB');
    calculations.schedule_variation = value;
  }

  // 11. Requirements Traceability
  if (input.requirements_mapped_to_tc != null && input.total_requirements != null && input.total_requirements > 0) {
    const value = (input.requirements_mapped_to_tc / input.total_requirements) * 100;
    await saveCalculatedMetric(db, projectId, periodStart, periodEnd, 'requirements_traceability', value, '%', 'HTB');
    calculations.requirements_traceability = value;
  }

  // 12. On Time Completion of Milestones or Deliverables
  if (input.milestones_completed_ontime != null && input.total_milestones != null && input.total_milestones > 0) {
    const value = (input.milestones_completed_ontime / input.total_milestones) * 100;
    await saveCalculatedMetric(db, projectId, periodStart, periodEnd, 'on_time_completion_milestones', value, '%', 'HTB');
    calculations.on_time_completion_milestones = value;
  }

  return calculations;
}

async function saveCalculatedMetric(db, projectId, periodStart, periodEnd, metricKey, value, unit, direction) {
  try {
    await db.run(`
      INSERT OR REPLACE INTO calculated_metrics 
      (project_id, period_start, period_end, metric_key, metric_value, unit, direction)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [projectId, periodStart, periodEnd, metricKey, value, unit, direction]);
  } catch (error) {
    console.error(`Error saving calculated metric ${metricKey}:`, error);
  }
}

// Get calculated metrics for dashboard
router.get('/calculated', async (req, res) => {
  const db = await getDb();
  let { projectId, periodStart, periodEnd } = req.query;

  try {
    let query = 'SELECT metric_key, metric_value, unit, direction FROM calculated_metrics WHERE 1=1';
    const params = [];

    // Enforce project scope for non-admin users
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin) {
      projectId = req.user?.projectId || null;
    }

    if (projectId) {
      query += ' AND project_id = ?';
      params.push(projectId);
    }
    if (periodStart) {
      query += ' AND period_start >= ?';
      params.push(periodStart);
    }
    if (periodEnd) {
      query += ' AND period_end <= ?';
      params.push(periodEnd);
    }

    query += ' ORDER BY calculated_at DESC';

    const metrics = await db.all(query, params);
    
    // Group by latest period if no specific period provided
    const latestMetrics = {};
    metrics.forEach(m => {
      if (!latestMetrics[m.metric_key]) {
        latestMetrics[m.metric_key] = m;
      }
    });

    res.json(latestMetrics);
  } catch (error) {
    console.error('Error fetching calculated metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get time-series data for graphs
router.get('/time-series', async (req, res) => {
  const db = await getDb();
  let { periodStart, periodEnd, metricKey, projectId } = req.query;

  try {
    let query = `
      SELECT 
        cm.project_id,
        p.name as project_name,
        cm.period_start,
        cm.period_end,
        cm.metric_key,
        cm.metric_value,
        cm.unit,
        cm.direction
      FROM calculated_metrics cm
      JOIN projects p ON cm.project_id = p.id
      WHERE 1=1
    `;
    const params = [];

    // Enforce project scope for non-admin users
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin) {
      projectId = req.user?.projectId || null;
    }

    if (periodStart) {
      query += ' AND cm.period_start >= ?';
      params.push(periodStart);
    }
    if (periodEnd) {
      query += ' AND cm.period_end <= ?';
      params.push(periodEnd);
    }
    if (metricKey) {
      query += ' AND cm.metric_key = ?';
      params.push(metricKey);
    }
    if (projectId) {
      query += ' AND cm.project_id = ?';
      params.push(projectId);
    }

    query += ' ORDER BY cm.period_start ASC, p.name ASC';

    const metrics = await db.all(query, params);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching time-series data:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

// ---------------------------
// File Templates & Upload API
// ---------------------------

// Required columns for upload/template
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

// GET /api/metric-inputs/template?format=xlsx|csv
router.get('/template', async (req, res) => {
  try {
    const format = (req.query.format || 'xlsx').toLowerCase();

    // Create a blank sheet with headers
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
  } catch (error) {
    console.error('Template error:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// Helper
function valOrNull(v) {
  if (v === '' || v === undefined || v === null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

// POST /api/metric-inputs/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const isAdmin = req.user?.role === 'admin';
  const scopedProjectId = req.user?.projectId ? Number(req.user.projectId) : null;
  const results = { inserted: 0, skipped: 0, errors: [] };
  const dryRun = String(req.query.dryRun || '').toLowerCase() === 'true';

  try {
    // Parse using XLSX (works for xlsx/csv). For txt assume CSV fallback.
    let workbook;
    try {
      workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    } catch {
      const text = req.file.buffer.toString('utf8');
      const ws = XLSX.utils.aoa_to_sheet(text.split(/\\r?\\n/).map(line => line.split(',')));
      workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, ws, 'Sheet1');
    }

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: null });

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'File has no data rows' });
    }

    // Validate required columns
    const headerKeys = Object.keys(rows[0] || {});
    const missing = REQUIRED_COLUMNS.filter(c => !headerKeys.includes(c));
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required columns: ${missing.join(', ')}` });
    }

    const db = await getDb();
    if (!dryRun) await db.exec('BEGIN');

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      // Enforce project scope
      if (!isAdmin) {
        if (!scopedProjectId) {
          results.errors.push({ row: i + 2, error: 'No project scope in session' });
          results.skipped++;
          continue;
        }
        if (r.project_id == null || r.project_id === '') {
          r.project_id = scopedProjectId;
        }
        if (Number(r.project_id) !== scopedProjectId) {
          results.errors.push({ row: i + 2, error: `Row project_id ${r.project_id} does not match your scoped project` });
          results.skipped++;
          continue;
        }
      }

      if (!r.project_id || !r.period_start || !r.period_end) {
        results.errors.push({ row: i + 2, error: 'Missing project_id / period_start / period_end' });
        results.skipped++;
        continue;
      }

      try {
        if (!dryRun) {
          await db.run(`
            INSERT INTO metric_inputs (
              project_id, period_start, period_end,
              test_cases_designed, effort_design_review_rework,
              test_cases_executed_productivity, effort_execution,
              testable_reqs_mapped_to_tc, baselined_testable_reqs,
              test_cases_executed, test_cases_planned,
              person_days_lost_downtime, planned_effort_person_days,
              defects_rejected, valid_defects_raised,
              actual_effort_closed, estimated_effort_closed,
              actual_effort_hours, story_points_accepted_effort,
              automated_test_cases, total_test_cases,
              actual_end_date_days, planned_end_date_days,
              requirements_mapped_to_tc, total_requirements,
              milestones_completed_ontime, total_milestones
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          `, [
            r.project_id, r.period_start, r.period_end,
            valOrNull(r.test_cases_designed), valOrNull(r.effort_design_review_rework),
            valOrNull(r.test_cases_executed_productivity), valOrNull(r.effort_execution),
            valOrNull(r.testable_reqs_mapped_to_tc), valOrNull(r.baselined_testable_reqs),
            valOrNull(r.test_cases_executed), valOrNull(r.test_cases_planned),
            valOrNull(r.person_days_lost_downtime), valOrNull(r.planned_effort_person_days),
            valOrNull(r.defects_rejected), valOrNull(r.valid_defects_raised),
            valOrNull(r.actual_effort_closed), valOrNull(r.estimated_effort_closed),
            valOrNull(r.actual_effort_hours), valOrNull(r.story_points_accepted_effort),
            valOrNull(r.automated_test_cases), valOrNull(r.total_test_cases),
            valOrNull(r.actual_end_date_days), valOrNull(r.planned_end_date_days),
            valOrNull(r.requirements_mapped_to_tc), valOrNull(r.total_requirements),
            valOrNull(r.milestones_completed_ontime), valOrNull(r.total_milestones)
          ]);

          await calculateAllMetrics(db, r.project_id, r.period_start, r.period_end);
        }
        results.inserted++;
      } catch (rowErr) {
        results.errors.push({ row: i + 2, error: rowErr.message || String(rowErr) });
        results.skipped++;
      }
    }

    if (!dryRun) await db.exec('COMMIT');
    res.json(results);
  } catch (error) {
    try {
      const db = await getDb();
      await db.exec('ROLLBACK');
    } catch {}
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process file' });
  }
});
