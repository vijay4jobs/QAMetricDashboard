import express from 'express';
import { getDb } from '../db.js';

const router = express.Router();

// Query table data
router.get('/query/:table', async (req, res) => {
  const { table } = req.params;
  const allowedTables = ['projects', 'metric_inputs', 'calculated_metrics', 'metric_definitions', 'users', 'sessions'];
  
  console.log(`Admin query request for table: ${table}`);
  
  if (!allowedTables.includes(table)) {
    console.error(`Invalid table name: ${table}`);
    return res.status(400).json({ error: 'Invalid table name' });
  }

  try {
    const db = await getDb();

    // Non-admins cannot query users or sessions tables
    if ((table === 'users' || table === 'sessions') && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 500);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

    let rows;
    if (table === 'users') {
      rows = await db.all(`
        SELECT id, username, email, role, is_active, created_at, updated_at 
        FROM users 
        ORDER BY id DESC LIMIT ? OFFSET ?
      `, [limit, offset]);
    } else {
      rows = await db.all(`SELECT * FROM ${table} ORDER BY id DESC LIMIT ? OFFSET ?`, [limit, offset]);
    }

    // CSV export
    const wantsCsv = (req.query.format || '').toLowerCase() === 'csv' || String(req.headers.accept || '').includes('text/csv');
    if (wantsCsv) {
      const cols = rows.length ? Object.keys(rows[0]) : [];
      const header = cols.join(',');
      const body = rows.map(r => cols.map(c => String(r[c] ?? '').replace(/"/g,'""')).map(v => `"${v}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      return res.send([header, body].filter(Boolean).join('\n'));
    }

    console.log(`Query successful for ${table}, returned ${rows.length} records (limit=${limit}, offset=${offset})`);
    res.json({ data: rows, meta: { limit, offset, count: rows.length } });
  } catch (error) {
    console.error(`Error querying ${table}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Delete record from table
router.delete('/delete/:table/:id', async (req, res) => {
  const { table, id } = req.params;
  const allowedTables = ['projects', 'metric_inputs', 'calculated_metrics', 'metric_definitions', 'users'];
  
  if (!allowedTables.includes(table)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    // Only admins can delete records
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const db = await getDb();
    await db.run(`DELETE FROM ${table} WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Record deleted successfully' });
  } catch (error) {
    console.error(`Error deleting from ${table}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const db = await getDb();
    const users = await db.all(`
      SELECT id, username, email, role, is_active, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle user active status
router.put('/users/:id/toggle-active', async (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { id } = req.params;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const db = await getDb();
    
    // Get current status
    const user = await db.get(`SELECT is_active FROM users WHERE id = ?`, [id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Toggle status
    const newStatus = user.is_active ? 0 : 1;
    await db.run(`UPDATE users SET is_active = ? WHERE id = ?`, [newStatus, id]);

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all active metrics
router.get('/metrics', async (req, res) => {
  try {
    const db = await getDb();
    const metrics = await db.all(`
      SELECT * FROM metric_definitions 
      WHERE is_active = 1 
      ORDER BY display_order ASC, id ASC
    `);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add new metric
router.post('/metrics', async (req, res) => {
  const { metric_key, name, unit, direction, description, display_order } = req.body;
  
  if (!metric_key || !name || !unit || !direction) {
    return res.status(400).json({ error: 'metric_key, name, unit, and direction are required' });
  }

  if (!['HTB', 'LTB'].includes(direction)) {
    return res.status(400).json({ error: 'direction must be HTB or LTB' });
  }

  try {
    const db = await getDb();
    const result = await db.run(`
      INSERT INTO metric_definitions (metric_key, name, unit, direction, description, display_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [metric_key, name, unit, direction, description || null, display_order || 0]);
    
    res.status(201).json({ 
      id: result.lastID || result.id,
      message: 'Metric added successfully' 
    });
  } catch (error) {
    console.error('Error adding metric:', error);
    if (error.code === 'SQLITE_CONSTRAINT' || error.code === '23505') {
      return res.status(409).json({ error: 'Metric with this key already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update metric
router.put('/metrics/:id', async (req, res) => {
  const { id } = req.params;
  const { name, unit, direction, description, display_order, is_active } = req.body;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  if (direction && !['HTB', 'LTB'].includes(direction)) {
    return res.status(400).json({ error: 'direction must be HTB or LTB' });
  }

  try {
    const db = await getDb();
    
    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (unit !== undefined) { updates.push('unit = ?'); values.push(unit); }
    if (direction !== undefined) { updates.push('direction = ?'); values.push(direction); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (display_order !== undefined) { updates.push('display_order = ?'); values.push(display_order); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(id);
    
    await db.run(`
      UPDATE metric_definitions 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, values);
    
    res.json({ message: 'Metric updated successfully' });
  } catch (error) {
    console.error('Error updating metric:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

