import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

router.get('/overview', async (req, res) => {
  const db = await getDb();
  const { dateFrom, dateTo, projectId, tester } = req.query;

  const filters = [];
  const params = [];
  if (projectId) { filters.push('project_id = ?'); params.push(projectId); }
  if (dateFrom) { filters.push('created_at >= ?'); params.push(dateFrom); }
  if (dateTo) { filters.push('created_at <= ?'); params.push(dateTo); }
  const defectWhere = filters.length? 'WHERE '+filters.join(' AND '):'';

  const runFilters = [];
  const runParams = [];
  if (projectId) { runFilters.push('project_id = ?'); runParams.push(projectId); }
  if (dateFrom) { runFilters.push('executed_at >= ?'); runParams.push(dateFrom); }
  if (dateTo) { runFilters.push('executed_at <= ?'); runParams.push(dateTo); }
  if (tester) { runFilters.push('executed_by = ?'); runParams.push(tester); }
  const runWhere = runFilters.length? 'WHERE '+runFilters.join(' AND '):'';

  const defectsTesting = await db.get(`SELECT COUNT(*) as c FROM defects ${defectWhere} ${defectWhere? ' AND ': 'WHERE '} source = 'TESTING'`, params);
  const defectsProd = await db.get(`SELECT COUNT(*) as c FROM defects ${defectWhere} ${defectWhere? ' AND ': 'WHERE '} source = 'PROD'`, params);
  const ddr = (defectsTesting?.c||0) / Math.max(1, (defectsTesting?.c||0) + (defectsProd?.c||0));

  const avgExec = await db.get(`SELECT AVG(duration_minutes) as avg FROM test_runs ${runWhere}`, runParams);
  const regressionFailures = await db.get(`SELECT COUNT(*) as c FROM test_runs ${runWhere} ${runWhere? ' AND ': 'WHERE '} status = 'FAILED'`, runParams);
  const blockedTests = await db.get(`SELECT COUNT(*) as c FROM test_runs ${runWhere} ${runWhere? ' AND ': 'WHERE '} status = 'BLOCKED'`, runParams);

  // Coverage placeholder (if coverage_stats filled)
  const cov = await db.get(`SELECT SUM(requirements_covered) as covered, SUM(requirements_total) as total FROM coverage_stats ${projectId? 'WHERE project_id = ?':''}`, projectId? [projectId]:[]);
  const coverage = cov && cov.total ? cov.covered / cov.total : null;

  // Simple trend: last 7 days DDR
  const trend = await db.all(`WITH days AS (
    SELECT date('now','-6 day') as d UNION ALL
    SELECT date('now','-5 day') UNION ALL
    SELECT date('now','-4 day') UNION ALL
    SELECT date('now','-3 day') UNION ALL
    SELECT date('now','-2 day') UNION ALL
    SELECT date('now','-1 day') UNION ALL
    SELECT date('now')
  )
  SELECT d as day,
    (SELECT COUNT(*) FROM defects WHERE source='TESTING' AND date(created_at)=d ${projectId? ' AND project_id = ?':''}) as test_def,
    (SELECT COUNT(*) FROM defects WHERE source='PROD' AND date(created_at)=d ${projectId? ' AND project_id = ?':''}) as prod_def
  FROM days`, projectId? [projectId, projectId]: []);
  const ddrTrend = trend.map(t => ({ day: t.day, ddr: t.test_def / Math.max(1, t.test_def + t.prod_def) }));

  res.json({
    ddr: Number(ddr.toFixed(3)),
    avg_execution_time_min: avgExec?.avg? Number(avgExec.avg.toFixed(2)) : 0,
    coverage: coverage !== null ? Number((coverage*100).toFixed(1)) : null,
    regression_failures: regressionFailures?.c||0,
    blocked_tests: blockedTests?.c||0,
    ddr_trend: ddrTrend
  });
});

export default router;
