import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const db = await getDb();
  const dir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  for (const f of files) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf-8');
    console.log('Applying migration', f);
    await db.exec(sql);
  }
  console.log('Migrations complete');
  if (db.close) await db.close();
})();
