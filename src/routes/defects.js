import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

router.get('/', async (req,res) => {
  const { page=1, pageSize=20 } = req.query;
  const limit = Number(pageSize); const offset = (Number(page)-1)*limit;
  const db = await getDb();
  const rows = await db.all(`SELECT * FROM defects ORDER BY created_at DESC LIMIT ? OFFSET ?`, [limit, offset]);
  res.json(rows);
});

router.post('/', async (req,res) => {
  const { project_id, source, severity, status, created_at, resolved_at } = req.body;
  const db = await getDb();
  const r = await db.run(`INSERT INTO defects(project_id, source, severity, status, created_at, resolved_at) VALUES (?,?,?,?,?,?)`, [project_id, source, severity, status, created_at, resolved_at]);
  res.status(201).json({ id: r.lastID || r.id });
});

router.patch('/:id', async (req,res) => {
  const id = req.params.id;
  const fields = ['project_id','source','severity','status','created_at','resolved_at'];
  const sets=[]; const params=[];
  for (const f of fields) if (f in req.body){ sets.push(`${f} = ?`); params.push(req.body[f]); }
  if (!sets.length) return res.status(400).json({ error: 'no fields' });
  params.push(id);
  const db = await getDb();
  await db.run(`UPDATE defects SET ${sets.join(', ')} WHERE id = ?`, params);
  res.json({ updated: true });
});

export default router;
