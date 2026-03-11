/**
 * migrate-to-supabase.js
 * One-shot script to import existing JSON data from ./data/ into Supabase.
 * Run AFTER creating the schema (supabase/schema.sql) in the Supabase SQL editor.
 *
 * Usage: node scripts/migrate-to-supabase.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const DATA_DIR = path.join(__dirname, '../data');

function readJSON(file, fallback) {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) return fallback;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}

async function migrate() {
  console.log('🚀 Starting migration to Supabase...\n');

  // ── Projects ──────────────────────────────────────────────────────────────
  const projects = readJSON('projects.json', []);
  console.log(`Found ${projects.length} projects`);

  for (const p of projects) {
    const projectRow = {
      id:          p.id,
      name:        p.name,
      engine:      p.engine || null,
      status:      p.status || 'Active',
      description: p.description || null,
      tags:        p.tags || [],
      repo_url:    p.repoUrl || '',
      progress:    p.progress || 0,
      created_at:  p.createdAt || new Date().toISOString(),
      updated_at:  p.updatedAt || new Date().toISOString(),
    };
    const { error } = await supabase.from('projects').upsert([projectRow]);
    if (error) { console.error(`  ❌ Project "${p.name}":`, error.message); continue; }
    console.log(`  ✅ Project: ${p.name}`);

    // Tasks
    for (const t of (p.tasks || [])) {
      await supabase.from('project_tasks').upsert([{
        id:         t.id,
        project_id: p.id,
        title:      t.title,
        status:     t.status || 'todo',
        priority:   t.priority || 'medium',
        created_at: t.createdAt || new Date().toISOString(),
      }]);
    }
    if (p.tasks?.length) console.log(`     └─ ${p.tasks.length} tasks`);

    // Notes
    for (const n of (p.notes || [])) {
      if (!n.content) continue;
      await supabase.from('project_notes').upsert([{
        id:         n.id || (Date.now().toString(36) + Math.random().toString(36).slice(2,5)),
        project_id: p.id,
        content:    n.content,
        created_at: n.createdAt || new Date().toISOString(),
      }]);
    }
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  const notes = readJSON('notes.json', []);
  console.log(`\nFound ${notes.length} notes`);
  for (const n of notes) {
    const { error } = await supabase.from('notes').upsert([{
      id:         n.id,
      title:      n.title,
      content:    n.content || '',
      tags:       n.tags || [],
      created_at: n.createdAt || new Date().toISOString(),
      updated_at: n.updatedAt || new Date().toISOString(),
    }]);
    if (error) console.error(`  ❌ Note "${n.title}":`, error.message);
    else console.log(`  ✅ Note: ${n.title}`);
  }

  // ── Queue ─────────────────────────────────────────────────────────────────
  const queue = readJSON('queue.json', []);
  console.log(`\nFound ${queue.length} queue items`);
  for (const q of queue) {
    const { error } = await supabase.from('queue').upsert([{
      id:         q.id,
      title:      q.title,
      status:     q.status || 'queued',
      priority:   q.priority || 'medium',
      project:    q.project || null,
      created_at: q.createdAt || new Date().toISOString(),
    }]);
    if (error) console.error(`  ❌ Queue "${q.title}":`, error.message);
    else console.log(`  ✅ Queue: ${q.title}`);
  }

  // ── Settings ──────────────────────────────────────────────────────────────
  const settings = readJSON('settings.json', {});
  const settingsKeys = Object.keys(settings);
  if (settingsKeys.length) {
    console.log(`\nFound ${settingsKeys.length} settings`);
    const rows = Object.entries(settings).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' });
    if (error) console.error('  ❌ Settings:', error.message);
    else console.log('  ✅ Settings migrated');
  }

  console.log('\n✅ Migration complete!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
