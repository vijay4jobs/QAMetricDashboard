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
  
  // Trim and validate name
  const trimmedName = name.trim();
  if (!trimmedName) return res.status(400).json({ error: 'Project name cannot be empty' });
  
  const db = await getDb();
  try {
    // Check if project already exists before inserting
    const existing = await db.get(`SELECT id FROM projects WHERE name = ?`, [trimmedName]);
    if (existing) {
      return res.status(409).json({ error: 'Project with this name already exists' });
    }
    
    const r = await db.run(`INSERT INTO projects(name) VALUES (?)`, [trimmedName]);
    res.status(201).json({ id: r.lastID || r.id });
  } catch (error) {
    // Handle constraint errors (SQLite and PostgreSQL)
    if (error.code === 'SQLITE_CONSTRAINT' || 
        error.code === '23505' || 
        error.errno === 19 ||
        (error.message && error.message.includes('UNIQUE constraint failed'))) {
      return res.status(409).json({ error: 'Project with this name already exists' });
    }
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

export default router;
