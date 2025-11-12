// Simple CSV export script (example usage: node scripts/exportCsv.js defects > defects.csv)
import { getDb } from '../src/db.js';
const type = process.argv[2] || 'test_runs';
const db = await getDb();
const rows = await db.all(`SELECT * FROM ${type}`);
if (!rows.length) process.exit(0);
const headers = Object.keys(rows[0]);
console.log(headers.join(','));
for (const r of rows) {
  console.log(headers.map(h => JSON.stringify(r[h] ?? '')).join(','));
}
