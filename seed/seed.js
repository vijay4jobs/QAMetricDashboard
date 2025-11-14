import { getDb } from '../src/db.js';

function rand(arr){return arr[Math.floor(Math.random()*arr.length)];}

(async () => {
  const db = await getDb();
  console.log('Seeding data');
  // Insert projects only if they don't exist (handle duplicates gracefully)
  const projectNames = ['Project Alpha', 'Project Beta'];
  for (const name of projectNames) {
    try {
      const existing = await db.get(`SELECT id FROM projects WHERE name = ?`, [name]);
      if (!existing) {
        await db.run(`INSERT INTO projects(name) VALUES (?)`, [name]);
      }
    } catch (error) {
      // If constraint error, project already exists - skip
      if (error.code === 'SQLITE_CONSTRAINT' || error.code === '23505' || error.errno === 19) {
        console.log(`Project "${name}" already exists, skipping...`);
      } else {
        console.error(`Error inserting project "${name}":`, error);
      }
    }
  }
  const projects = await db.all('SELECT id FROM projects');
  const testers = ['alice','bob','carol'];
  const statuses = ['PASSED','FAILED','BLOCKED'];
  const sources = ['TESTING','PROD'];
  const severities = ['LOW','MEDIUM','HIGH','CRITICAL'];
  const now = Date.now();
  for (let i=0;i<120;i++) {
    const project_id = rand(projects).id;
    const executed_at = new Date(now - Math.random()*1000*60*60*24*30).toISOString();
    const duration_minutes = 5 + Math.floor(Math.random()*55);
    const status = rand(statuses);
    await db.run(`INSERT INTO test_runs(project_id, executed_by, executed_at, duration_minutes, status) VALUES (?,?,?,?,?)`, [project_id, rand(testers), executed_at, duration_minutes, status]);
  }
  for (let i=0;i<80;i++) {
    const project_id = rand(projects).id;
    const created_at = new Date(now - Math.random()*1000*60*60*24*30).toISOString();
    const source = rand(sources);
    const severity = rand(severities);
    const status = rand(['OPEN','IN_PROGRESS','RESOLVED','CLOSED']);
    const resolved_at = Math.random()>0.5 ? new Date(Date.parse(created_at)+ Math.random()*1000*60*60*24*7).toISOString() : null;
    await db.run(`INSERT INTO defects(project_id, source, severity, status, created_at, resolved_at) VALUES (?,?,?,?,?,?)`, [project_id, source, severity, status, created_at, resolved_at]);
  }
  console.log('Seed complete');
  if (db.close) await db.close();
})();
