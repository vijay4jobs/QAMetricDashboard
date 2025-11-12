import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

router.post('/', async (req,res) => {
  const { project_id, period_start, period_end, target_ddr, target_coverage, max_exec_time_min, max_regression_failures, max_blocked_tests } = req.body;
  const db = await getDb();
  // Upsert simplistic (SQLite lacks native upsert older versions) - try find existing
  const existing = await db.get(`SELECT id FROM metric_targets WHERE project_id = ? AND period_start = ? AND period_end = ?`, [project_id, period_start, period_end]);
  if (existing) {
    await db.run(`UPDATE metric_targets SET target_ddr=?, target_coverage=?, max_exec_time_min=?, max_regression_failures=?, max_blocked_tests=? WHERE id=?`, [target_ddr, target_coverage, max_exec_time_min, max_regression_failures, max_blocked_tests, existing.id]);
    return res.json({ id: existing.id, updated: true });
  } else {
    const r = await db.run(`INSERT INTO metric_targets(project_id, period_start, period_end, target_ddr, target_coverage, max_exec_time_min, max_regression_failures, max_blocked_tests) VALUES (?,?,?,?,?,?,?,?)`, [project_id, period_start, period_end, target_ddr, target_coverage, max_exec_time_min, max_regression_failures, max_blocked_tests]);
    return res.status(201).json({ id: r.lastID || r.id });
  }
});

export default router;
