import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

router.get('/', async (req,res) => {
  const db = await getDb();
  const projects = await db.all(`SELECT p.*, (
    SELECT COUNT(*) FROM test_runs tr WHERE tr.project_id = p.id
  ) as test_runs_count FROM projects p ORDER BY p.created_at DESC`);
  res.json(projects);
});

router.post('/', async (req,res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const db = await getDb();
  const r = await db.run(`INSERT INTO projects(name) VALUES (?)`, [name]);
  res.status(201).json({ id: r.lastID || r.id });
});

export default router;
