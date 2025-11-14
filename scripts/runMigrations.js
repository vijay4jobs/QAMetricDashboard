import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const db = await getDb();
  const dir = path.join(__dirname, '../migrations');
  
  // Ensure migration tracking table exists (run first migration if needed)
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error('Error creating migration tracking table:', error);
    // If table creation fails, try to continue (might already exist)
  }
  
  // Get list of applied migrations
  let appliedMigrations = [];
  try {
    const applied = await db.all('SELECT version FROM schema_migrations ORDER BY applied_at');
    appliedMigrations = applied.map(row => row.version || row.VERSION || row.Version);
  } catch (error) {
    console.warn('Could not read applied migrations, will attempt to apply all:', error.message);
    // If table doesn't exist, that's okay - it will be created
  }
  
  // Get all migration files and sort them
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  let appliedCount = 0;
  let skippedCount = 0;
  
  for (const f of files) {
    // Skip if already applied
    if (appliedMigrations.includes(f)) {
      console.log(`Skipping migration ${f} (already applied)`);
      skippedCount++;
      continue;
    }
    
    try {
      const sql = fs.readFileSync(path.join(dir, f), 'utf-8');
      console.log(`Applying migration ${f}...`);
      
      // Run migration in a transaction if possible
      await db.exec(sql);
      
      // Record migration as applied
      try {
        // Check if using PostgreSQL (has DATABASE_URL with postgres://)
        const isPostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres://');
        
        if (isPostgres) {
          // PostgreSQL: Use ON CONFLICT
          try {
            await db.run('INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING', [f]);
          } catch {
            // Fallback: check if exists first
            const exists = await db.get('SELECT version FROM schema_migrations WHERE version = $1', [f]);
            if (!exists) {
              await db.run('INSERT INTO schema_migrations (version) VALUES ($1)', [f]);
            }
          }
        } else {
          // SQLite: Use INSERT OR IGNORE
          await db.run('INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)', [f]);
        }
      } catch (insertError) {
        // If insert fails, migration might have been applied but not recorded
        // Check if it exists now
        const isPostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres://');
        const check = await db.get(
          isPostgres 
            ? 'SELECT version FROM schema_migrations WHERE version = $1' 
            : 'SELECT version FROM schema_migrations WHERE version = ?', 
          [f]
        );
        if (!check) {
          console.warn(`Warning: Migration ${f} applied but could not be recorded in tracking table`);
        }
      }
      
      appliedCount++;
      console.log(`✓ Migration ${f} applied successfully`);
    } catch (error) {
      console.error(`✗ Error applying migration ${f}:`, error.message);
      // Continue with other migrations instead of failing completely
      // Some migrations might fail if they've already been partially applied
      if (error.message && error.message.includes('already exists')) {
        console.log(`  (Migration ${f} appears to have been partially applied, skipping)`);
        // Try to record it anyway
        try {
          const isPostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres://');
          if (isPostgres) {
            await db.run('INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING', [f]);
          } else {
            await db.run('INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)', [f]);
          }
        } catch {}
      }
    }
  }
  
  console.log(`\nMigrations complete: ${appliedCount} applied, ${skippedCount} skipped`);
  if (db.close) await db.close();
})();
