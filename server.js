require('dotenv').config({ path: require('path').join(__dirname, '.env.local') });

const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const os      = require('os');
const http    = require('http');
const multer  = require('multer');
const jwt     = require('jsonwebtoken');
const { execSync, exec } = require('child_process');
const supabase = require('./lib/supabase');

const IS_VERCEL  = !!process.env.VERCEL;
const JWT_SECRET = process.env.MC_JWT_SECRET || 'dev-secret';
const MC_PASSWORD = (process.env.MC_PASSWORD || 'shadow2026').trim();
const OPENCLAW_TOKEN = 'mc-shadow-2026';

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'Invalid token' }); }
}

const app      = express();
const PORT     = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const CHAT_UPLOADS_DIR = path.join(__dirname, 'uploads', 'chat');

if (!IS_VERCEL) {
  [DATA_DIR, UPLOADS_DIR, CHAT_UPLOADS_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));
}

app.use(cors({
  origin: ['http://localhost:3000', 'https://mission-control-wheat-pi.vercel.app', /\.vercel\.app$/, /\.ts\.net$/],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
// Serve static files (except index.html — handled below)
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// API: LLM info – reads OpenClaw config and returns current primary + fallbacks
app.get('/api/llm', requireAuth, (req, res) => {
  try {
    const cfgPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
    if (!fs.existsSync(cfgPath)) return res.json({ error: 'OpenClaw config not found' });
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    const primary = cfg?.agents?.defaults?.model?.primary || 'unknown';
    const fallbacks = cfg?.agents?.defaults?.model?.fallbacks || [];
    res.json({ primary, fallbacks });
  } catch(e) {
    res.json({ error: e.message });
  }
});

// Inject LOCAL_API_URL into index.html
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  const localUrl = (process.env.LOCAL_API_URL || '').trim();
  html = html.replace('</head>', `<script>window.__LOCAL_API_URL__="${localUrl}";</script>\n</head>`);
  res.send(html);
});

// Config endpoint — lets frontend know the local API URL
app.get('/api/config', (req, res) => {
  res.json({ localApiUrl: (process.env.LOCAL_API_URL || '').trim() });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    // sanitize le nom original, garde l'extension
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    // évite les collisions
    const unique = Date.now() + '_' + safe;
    cb(null, unique);
  }
});
const upload = multer({ storage });

const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CHAT_UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'))
});
const chatUpload = multer({ storage: chatStorage });

// ─── Token stats (accumulated from chat calls) ────────────────────────────────
let _tokenStats = { tokensIn: 0, tokensOut: 0, cacheTokens: 0, calls: 0, startedAt: Date.now() };

// ─── Settings cache (synced from Supabase) ───────────────────────────────────
let _settingsCache = {};
async function refreshSettingsCache() {
  try {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) { console.error('[settings cache] Supabase error:', error.message); return; }
    if (data && data.length) {
      const s = {};
      data.forEach(row => { s[row.key] = row.value; });
      _settingsCache = s;
      console.log('[settings cache] loaded, dailyTokenBudget =', _settingsCache.dailyTokenBudget);
    } else {
      console.warn('[settings cache] no rows returned from Supabase');
    }
  } catch(e) { console.error('[settings cache] exception:', e.message); }
}
// Refresh on startup + every 60s
refreshSettingsCache();
setInterval(refreshSettingsCache, 60_000);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readJSON(file, fallback = []) {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) return fallback;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return fallback; }
}
function writeJSON(file, data) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function calcProgress(tasks) {
  if (!tasks || !tasks.length) return 0;
  return Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100);
}

// ─── Supabase shape helpers ───────────────────────────────────────────────────

function toFrontendProject(p) {
  return {
    id: p.id, name: p.name, engine: p.engine, status: p.status,
    description: p.description, tags: p.tags || [], repoUrl: p.repo_url || '',
    language: p.language || null,
    progress: p.progress || 0, createdAt: p.created_at, updatedAt: p.updated_at,
    tasks: p.project_tasks || p.tasks || [],
    notes: p.project_notes || p.notes || [],
  };
}
function toSupabaseProject(body) {
  return {
    name: body.name, engine: body.engine || 'Autre', status: body.status || 'Active',
    description: body.description || '', tags: body.tags || [],
    repo_url: body.repoUrl || body.repo_url || '',
    language: body.language || null,
    progress: body.progress || 0,
  };
}
function toFrontendNote(n)      { return { ...n, createdAt: n.created_at, updatedAt: n.updated_at }; }
function toFrontendQueueItem(q) { return { ...q, createdAt: q.created_at }; }
function toFrontendTask(t)      { return { ...t, createdAt: t.created_at, progressNote: t.progress_note }; }

// ─── API: Auth ────────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (password !== MC_PASSWORD) return res.status(401).json({ error: 'Wrong password' });
  const token = jwt.sign({ user: 'shadow' }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token });
});

app.get('/api/auth/check', requireAuth, (req, res) => res.json({ ok: true }));

// ─── API: Projects ────────────────────────────────────────────────────────────

app.get('/api/projects', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('projects').select('*, project_tasks(*), project_notes(*)').order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(toFrontendProject));
});
app.post('/api/projects', requireAuth, async (req, res) => {
  const row = { id: uid(), ...toSupabaseProject(req.body), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from('projects').insert([row]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(toFrontendProject(data));
});
app.get('/api/projects/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('projects').select('*, project_tasks(*), project_notes(*)').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Not found' });
  res.json(toFrontendProject(data));
});
app.put('/api/projects/:id', requireAuth, async (req, res) => {
  const updates = { ...toSupabaseProject(req.body), updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from('projects').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(toFrontendProject(data));
});
app.delete('/api/projects/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('projects').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});
app.post('/api/projects/:id/tasks', requireAuth, async (req, res) => {
  const task = { id: uid(), project_id: req.params.id, status: 'todo', priority: 'medium', created_at: new Date().toISOString(), ...req.body };
  const { data, error } = await supabase.from('project_tasks').insert([task]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  const { data: allTasks } = await supabase.from('project_tasks').select('status').eq('project_id', req.params.id);
  await supabase.from('projects').update({ progress: calcProgress(allTasks || []), updated_at: new Date().toISOString() }).eq('id', req.params.id);
  res.json(data);
});
app.put('/api/projects/:id/tasks/:taskId', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('project_tasks').update(req.body).eq('id', req.params.taskId).select().single();
  if (error) return res.status(500).json({ error: error.message });
  const { data: allTasks } = await supabase.from('project_tasks').select('status').eq('project_id', req.params.id);
  await supabase.from('projects').update({ progress: calcProgress(allTasks || []), updated_at: new Date().toISOString() }).eq('id', req.params.id);
  res.json(data);
});
app.delete('/api/projects/:id/tasks/:taskId', requireAuth, async (req, res) => {
  const { error } = await supabase.from('project_tasks').delete().eq('id', req.params.taskId);
  if (error) return res.status(500).json({ error: error.message });
  const { data: allTasks } = await supabase.from('project_tasks').select('status').eq('project_id', req.params.id);
  await supabase.from('projects').update({ progress: calcProgress(allTasks || []), updated_at: new Date().toISOString() }).eq('id', req.params.id);
  res.json({ ok: true });
});

// ─── API: Notes ───────────────────────────────────────────────────────────────

app.get('/api/notes', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('notes').select('*').order('updated_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(toFrontendNote));
});
app.post('/api/notes', requireAuth, async (req, res) => {
  const n = { id: uid(), tags: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...req.body };
  const { data, error } = await supabase.from('notes').insert([n]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(toFrontendNote(data));
});
app.put('/api/notes/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('notes').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(toFrontendNote(data));
});
app.delete('/api/notes/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('notes').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ─── API: Queue ───────────────────────────────────────────────────────────────

app.get('/api/queue', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('queue').select('*').order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(toFrontendQueueItem));
});
app.post('/api/queue', requireAuth, async (req, res) => {
  const item = { id: uid(), status: 'queued', priority: 'medium', created_at: new Date().toISOString(), ...req.body };
  const { data, error } = await supabase.from('queue').insert([item]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(toFrontendQueueItem(data));
});
app.put('/api/queue/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('queue').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(toFrontendQueueItem(data));
});
app.delete('/api/queue/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('queue').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ─── API: Settings ────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  theme: 'dark', ownerName: 'Shadow', ownerHandle: 'shadow9887', accentColor: '#58a6ff',
  language: 'en', compactMode: false, autoRefresh: true, autoRefreshInterval: 30,
  defaultPage: 'dashboard', dateFormat: 'relative', sidebarCollapsed: false, chatUploadEnabled: true
};
app.get('/api/settings', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('settings').select('*');
  if (error) return res.json(DEFAULT_SETTINGS);
  const s = {};
  (data || []).forEach(row => { s[row.key] = row.value; });
  res.json(Object.keys(s).length ? s : DEFAULT_SETTINGS);
});
app.put('/api/settings', requireAuth, async (req, res) => {
  const rows = Object.entries(req.body).map(([key, value]) => ({ key, value }));
  const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' });
  if (error) return res.status(500).json({ error: error.message });
  _settingsCache = { ..._settingsCache, ...req.body }; // keep cache hot immediately
  res.json(req.body);
});

// ─── API: Stats ───────────────────────────────────────────────────────────────

app.get('/api/stats', requireAuth, async (req, res) => {
  const [{ data: projects }, { data: queueItems }, { data: notes }, { data: tasks }] = await Promise.all([
    supabase.from('projects').select('status, project_tasks(status)'),
    supabase.from('queue').select('status'),
    supabase.from('notes').select('id'),
    supabase.from('tasks').select('status'),
  ]);
  const allTasks = (projects || []).flatMap(p => p.project_tasks || []);
  res.json({
    totalProjects:  (projects || []).length,
    activeProjects: (projects || []).filter(p => p.status === 'Active').length,
    totalTasks:     allTasks.length,
    doneTasks:      allTasks.filter(t => t.status === 'done').length,
    queuedItems:    (queueItems || []).filter(q => q.status === 'queued').length,
    pendingTasks:   (tasks || []).filter(t => t.status === 'queued').length,
    totalNotes:     (notes || []).length,
  });
});

// ─── API: Tasks (OpenClaw task queue) ─────────────────────────────────────────

app.get('/api/tasks', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(toFrontendTask));
});
app.post('/api/tasks', requireAuth, async (req, res) => {
  const t = { id: uid(), status: 'queued', progress: 0, created_at: new Date().toISOString(), ...req.body };
  const { data, error } = await supabase.from('tasks').insert([t]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(toFrontendTask(data));
});
app.put('/api/tasks/:id', requireAuth, async (req, res) => {
  const updates = { ...req.body };
  if (updates.progressNote) { updates.progress_note = updates.progressNote; delete updates.progressNote; }
  const { data, error } = await supabase.from('tasks').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(toFrontendTask(data));
});
app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
  const { error } = await supabase.from('tasks').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// ─── One-time migration: push orphan JSON projects → Supabase ─────────────────
app.post('/api/migrate', requireAuth, async (req, res) => {
  const local = readJSON('projects.json');
  if (!local.length) return res.json({ migrated: 0, message: 'No local projects found' });
  const { data: existing } = await supabase.from('projects').select('id');
  const existingIds = new Set((existing || []).map(p => p.id));
  const orphans = local.filter(p => !existingIds.has(p.id));
  if (!orphans.length) return res.json({ migrated: 0, message: 'Already in sync' });
  const rows = orphans.map(p => ({
    id: p.id, name: p.name, engine: p.engine || 'Autre', status: p.status || 'Active',
    description: p.description || '', tags: p.tags || [],
    repo_url: p.repoUrl || '', progress: p.progress || 0,
    created_at: p.createdAt || new Date().toISOString(),
    updated_at: p.updatedAt || new Date().toISOString(),
  }));
  const { error } = await supabase.from('projects').insert(rows);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ migrated: rows.length, names: rows.map(r => r.name) });
});

// ─── API: Uploads ─────────────────────────────────────────────────────────────
app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ ok: true, filename: req.file.originalname, size: req.file.size, path: req.file.path });
});
app.get('/api/uploads', requireAuth, (req, res) => {
  if (!fs.existsSync(UPLOADS_DIR)) return res.json([]);
  const files = fs.readdirSync(UPLOADS_DIR)
    .filter(f => !fs.statSync(path.join(UPLOADS_DIR, f)).isDirectory())
    .map(f => {
      const stat = fs.statSync(path.join(UPLOADS_DIR, f));
      return { name: f, size: stat.size, createdAt: stat.birthtime.toISOString() };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(files);
});

app.delete('/api/uploads/:filename', requireAuth, (req, res) => {
  const filename = path.basename(req.params.filename); 
  const filepath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'File not found' });
  fs.unlinkSync(filepath);
  res.json({ ok: true });
});

app.get('/api/uploads/:filename', requireAuth, (req, res) => {
  const filename = path.basename(req.params.filename);
  const filepath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'File not found' });
  res.download(filepath, filename);
});

// ─── API: Chat file upload ────────────────────────────────────────────────────
app.post('/api/chat/upload', chatUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  let content = '';
  try {
    const buf = fs.readFileSync(req.file.path);
    content = buf.toString('utf8');
    if (content.includes('\0')) content = '[Binary file — cannot display as text]';
    else if (content.length > 20000) content = content.slice(0, 20000) + '\n\n[...truncated at 20k chars]';
  } catch { content = '[Could not read file]'; }
  res.json({ ok: true, name: req.file.originalname, size: req.file.size, content });
});

// ─── API: Chat (proxy to OpenClaw gateway) ────────────────────────────────────
app.post('/api/chat', requireAuth, (req, res) => {
  if (IS_VERCEL) return res.json({ disabled: true, message: 'Chat not available in cloud mode. Run Mission Control locally to use AI chat.' });
  const { messages } = req.body;
  if (!messages || !messages.length) return res.status(400).json({ error: 'No messages' });

  const payload = JSON.stringify({ model: 'openclaw:main', messages, stream: false, user: 'mission-control' });
  const options = {
    hostname: '127.0.0.1', port: 18789, path: '/v1/chat/completions', method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
      'x-openclaw-agent-id': 'main'
    }
  };

  let rawBody = '';
  const proxyReq = http.request(options, (proxyRes) => {
    res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/json');
    res.status(proxyRes.statusCode);
    proxyRes.on('data', chunk => { rawBody += chunk; res.write(chunk); });
    proxyRes.on('end', () => {
      res.end();
      try {
        const parsed = JSON.parse(rawBody);
        if (parsed.usage) {
          _tokenStats.tokensIn  += parsed.usage.prompt_tokens     || parsed.usage.input_tokens  || 0;
          _tokenStats.tokensOut += parsed.usage.completion_tokens || parsed.usage.output_tokens || 0;
          _tokenStats.cacheTokens += parsed.usage.cache_read_input_tokens || 0;
          _tokenStats.calls++;
        }
      } catch {}
    });
  });
  proxyReq.on('error', (e) => {
    if (!res.headersSent) res.status(502).json({ error: 'Gateway unreachable: ' + e.message });
    else res.end();
  });
  proxyReq.write(payload);
  proxyReq.end();
});

// ─── API: Chat Streaming ──────────────────────────────────────────────────────
app.post('/api/chat/stream', requireAuth, (req, res) => {
  if (IS_VERCEL) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.write(`data: ${JSON.stringify({ error: 'Not available in cloud mode' })}\n\n`);
    return res.end();
  }
  const { messages } = req.body;
  if (!messages?.length) return res.status(400).json({ error: 'No messages' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const payload = JSON.stringify({ model: 'openclaw:main', messages, stream: true, user: 'mission-control' });
  const options = {
    hostname: '127.0.0.1', port: 18789, path: '/v1/chat/completions', method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
      'x-openclaw-agent-id': 'main'
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    proxyRes.on('data', chunk => {
      res.write(chunk);
    });
    proxyRes.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });
  });
  proxyReq.on('error', (e) => {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
  });
  req.on('close', () => proxyReq.destroy());
  proxyReq.write(payload);
  proxyReq.end();
});

// ─── Read auth profiles + usage stats from OpenClaw ─────────────────────────
const AUTH_PROFILES_FILE = path.join(os.homedir(), '.openclaw', 'agents', 'main', 'agent', 'auth-profiles.json');

function getAuthProfiles() {
  try {
    if (!fs.existsSync(AUTH_PROFILES_FILE)) return null;
    const raw = JSON.parse(fs.readFileSync(AUTH_PROFILES_FILE, 'utf8'));
    const now = Date.now();
    const result = {};

    for (const [name, profile] of Object.entries(raw.profiles || {})) {
      const stats     = raw.usageStats?.[name] || {};
      const keyVal    = profile.key || profile.token || '';
      const masked    = keyVal.length > 12
        ? keyVal.slice(0, 10) + '…' + keyVal.slice(-4)
        : keyVal ? '***' : '—';
      const onCooldown   = !!(stats.cooldownUntil && stats.cooldownUntil > now);
      const cooldownSecs = onCooldown ? Math.ceil((stats.cooldownUntil - now) / 1000) : 0;
      const lastUsedAgo  = stats.lastUsed
        ? Math.round((now - stats.lastUsed) / 60000)
        : null;

      result[name] = {
        provider:     profile.provider,
        type:         profile.type,
        masked,
        errorCount:   stats.errorCount   || 0,
        failureCounts: stats.failureCounts || {},
        lastUsed:     stats.lastUsed     || null,
        lastUsedAgo,
        onCooldown,
        cooldownSecs,
        lastFailureAt: stats.lastFailureAt || null,
      };
    }

    let activeProfile = null, latestUse = 0;
    for (const [name, p] of Object.entries(result)) {
      if (p.lastUsed && p.lastUsed > latestUse && !p.onCooldown) {
        latestUse = p.lastUsed;
        activeProfile = name;
      }
    }

    try {
      const cfgPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
      if (fs.existsSync(cfgPath)) {
        const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
        const configProfiles = cfg?.auth?.profiles || {};
        for (const [name, cp] of Object.entries(configProfiles)) {
          if (!result[name]) {
            result[name] = {
              provider: cp.provider,
              type: cp.mode || 'api_key',
              masked: '—',
              errorCount: 0,
              failureCounts: {},
              lastUsed: null,
              lastUsedAgo: null,
              onCooldown: false,
              cooldownSecs: 0,
              lastFailureAt: null,
            };
          }
        }
      }
    } catch {}

    return { profiles: result, activeProfile };
  } catch(e) {
    return null;
  }
}

// ─── Calculate today's token usage from all JSONL session files ───────────────
function getTodayUsage() {
  try {
    const sessionsDir = path.join(os.homedir(), '.openclaw', 'agents', 'main', 'sessions');
    if (!fs.existsSync(sessionsDir)) return null;

    const todayPrefix = new Date().toISOString().slice(0, 10);
    let inputFresh = 0, outputFresh = 0, cacheRead = 0, cacheWrite = 0, totalCost = 0, calls = 0;

    const jsonlFiles = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));

    for (const file of jsonlFiles) {
      const filePath = path.join(sessionsDir, file);
      try {
        const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (!entry.timestamp?.startsWith(todayPrefix)) continue;
            if (entry.type !== 'message') continue;
            const usage = entry.message?.usage;
            if (!usage) continue;
            inputFresh  += usage.input     || 0;
            outputFresh += usage.output    || 0;
            cacheRead   += usage.cacheRead || 0;
            cacheWrite  += usage.cacheWrite|| 0;
            totalCost   += usage.cost?.total || 0;
            calls++;
          } catch {}
        }
      } catch {}
    }

    const totalTokensToday = inputFresh + outputFresh + cacheRead + cacheWrite;
    return { inputFresh, outputFresh, cacheRead, cacheWrite, totalTokensToday, totalCost: totalCost.toFixed(4), calls };
  } catch(e) {
    return null;
  }
}

// ─── Read session data directly from sessions.json ───────────────────────────
const SESSIONS_FILE = path.join(os.homedir(), '.openclaw', 'agents', 'main', 'sessions', 'sessions.json');

function parseOpenclawStatus() {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) return { sessions: [], discord: null, rateLimitAt: null, resetInSeconds: null, lastSucceededModel: null };

    const raw = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    const now = Date.now();

    const sessions = Object.entries(raw).map(([key, s]) => {
      const total     = s.contextTokens || 200000;
      const used      = s.totalTokens   || 0;
      const pct       = Math.round((used / total) * 100);
      const cacheRead = s.cacheRead     || 0;
      const cacheAll  = cacheRead + (s.inputTokens || 0);
      const cacheRate = cacheAll > 0 ? Math.round((cacheRead / cacheAll) * 100) : null;
      const ageMins   = Math.round((now - (s.updatedAt || now)) / 60000);
      const ageLabel  = ageMins < 1 ? 'just now' : ageMins < 60 ? ageMins + 'm ago' : Math.round(ageMins/60) + 'h ago';

      let channel = 'other';
      if (key.includes('discord'))                  channel = 'discord';
      else if (key.includes('openai-user:mission')) channel = 'mission-control';
      else if (key.includes('openai'))              channel = 'api';

      return { key, channel, model: s.model, used, total, pct, cacheRate, ageLabel,
               inputTokens: s.inputTokens || 0, outputTokens: s.outputTokens || 0,
               cacheRead, cacheWrite: s.cacheWrite || 0 };
    });

    const discord = sessions.find(s => s.channel === 'discord') || null;

    // Rate limit: scan today's log
    let rateLimitAt = null, resetInSeconds = null;
    try {
      const logFile = path.join(os.tmpdir(), 'openclaw', `openclaw-${new Date().toISOString().slice(0,10)}.log`);
      if (fs.existsSync(logFile)) {
        const lines = fs.readFileSync(logFile, 'utf8').split('\n').slice(-500).reverse();
        const rl = lines.find(l => /rate.limit|429|overloaded/i.test(l));
        if (rl) {
          const ts = rl.match(/(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})/);
          if (ts) { rateLimitAt = new Date(ts[1]).toISOString(); resetInSeconds = Math.max(0, 3600 - (now - new Date(ts[1]).getTime()) / 1000); }
        }
      }
    } catch {}

    // Parse last succeeded candidate from logs
    let lastSucceededModel = null;
    try {
      const logFile = path.join(os.tmpdir(), 'openclaw', `openclaw-${new Date().toISOString().slice(0,10)}.log`);
      if (fs.existsSync(logFile)) {
        const lines = fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean).reverse();
        for (const line of lines) {
          if (line.includes('candidate_succeeded')) {
            const m = line.match(/"candidateModel":"([^"]+)"/);
            const p = line.match(/"candidateProvider":"([^"]+)"/);
            if (m && p) { lastSucceededModel = `${p[1]}/${m[1]}`; break; }
          }
        }
      }
    } catch {}

    return { sessions, discord, rateLimitAt, resetInSeconds, lastSucceededModel };
  } catch(e) {
    return { sessions: [], discord: null, rateLimitAt: null, resetInSeconds: null, lastSucceededModel: null, error: e.message };
  }
}

// ─── Parse last candidate_succeeded ──────────────────────────────────────────
function getActualActiveModel() {
  try {
    const logFile = path.join(os.tmpdir(), 'openclaw', `openclaw-${new Date().toISOString().slice(0,10)}.log`);
    if (!fs.existsSync(logFile)) return null;

    const lines = fs.readFileSync(logFile, 'utf8').split('\n').reverse();

    for (const line of lines) {
      if (!line.includes('candidate_succeeded')) continue;
      try {
        const parsed = JSON.parse(line);
        const entry = parsed['1'];
        if (entry && entry.decision === 'candidate_succeeded' && entry.candidateProvider && entry.candidateModel) {
          return `${entry.candidateProvider}/${entry.candidateModel}`;
        }
      } catch { continue; }
    }
    return null;
  } catch(e) {
    console.log('[DEBUG] error:', e.message);
    return null;
  }
}


// ─── Agent Status: shared collector ──────────────────────────────────────────
function collectAgentStatus(gateway, gatewayMs) {
  const clawStatus   = parseOpenclawStatus();
  const discord      = clawStatus.discord;
  const todayUsage   = getTodayUsage();
  const authProfiles = getAuthProfiles();
  const dailyBudget  = _settingsCache.dailyTokenBudget || 500000; // ← reads from Supabase cache
  const costIn  = (_tokenStats.tokensIn  / 1_000_000) * 3;
  const costOut = (_tokenStats.tokensOut / 1_000_000) * 15;
  const estCost = (_tokenStats.calls > 0) ? (costIn + costOut).toFixed(4) : null;
  const uptimeMins = Math.round((Date.now() - _tokenStats.startedAt) / 60000);

  let primaryModel = 'unknown';
  let fallbackModels = [];
  let modelConfig = {};
  try {
    const cfgPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      primaryModel   = cfg?.agents?.defaults?.model?.primary   || primaryModel;
      fallbackModels = cfg?.agents?.defaults?.model?.fallbacks || [];
      const allModels = [primaryModel, ...fallbackModels];
      const TOKEN_LIMITS = { anthropic: 80000, google: 1000000, ollama: null };
      allModels.forEach((m, i) => {
        const provider  = m.split('/')[0];
        const modelName = m.split('/').slice(1).join('/');
        modelConfig[provider] = {
          model: modelName || m,
          fullModel: m,
          role: i === 0 ? 'Primary' : `Fallback #${i}`,
          tokenLimit: TOKEN_LIMITS[provider] || null,
        };
      });
    }
  } catch(e) {  }

  return {
    activeModel: getActualActiveModel(),
    gateway, gatewayMs,
    model: primaryModel,
    lastSucceededModel: clawStatus.lastSucceededModel || null,
    fallbacks: fallbackModels,
    modelConfig,
    discord: discord ? {
      tokensUsed: discord.used, tokensTotal: discord.total, pct: discord.pct,
      cacheHitRate: discord.cacheRate, age: discord.ageLabel,
      inputTokens: discord.inputTokens, outputTokens: discord.outputTokens,
      cacheRead: discord.cacheRead, model: discord.model
    } : null,
    sessions: clawStatus.sessions,
    rateLimitAt: clawStatus.rateLimitAt,
    resetInSeconds: clawStatus.resetInSeconds,
    today: todayUsage ? {
      inputFresh: todayUsage.inputFresh, outputFresh: todayUsage.outputFresh,
      cacheRead: todayUsage.cacheRead,
      freshTokens: todayUsage.inputFresh + todayUsage.outputFresh,
      totalTokens: todayUsage.totalTokensToday, cost: todayUsage.totalCost,
      calls: todayUsage.calls, budget: dailyBudget,
      pct: Math.min(100, Math.round(((todayUsage.inputFresh + todayUsage.outputFresh) / dailyBudget) * 100)),
      remaining: Math.max(0, dailyBudget - todayUsage.inputFresh - todayUsage.outputFresh)
    } : null,
    dashboardCalls: _tokenStats.calls,
    estimatedCost: estCost,
    uptimeMins,
    apis: authProfiles,
    skills: ['gemini','github','gog','discord','weather','coding-agent','healthcheck','mcporter','skill-creator'],
    updatedAt: new Date().toISOString()
  };
}



// Probe gateway, collect status, return as promise
function probeAndCollect() {
  return new Promise((resolve) => {
    let done = false;
    const t0 = Date.now();
    const probe = http.request({ hostname: '127.0.0.1', port: 18789, path: '/', method: 'HEAD' }, (r) => {
      const gw = r.statusCode < 500;
      const ms = Date.now() - t0;
      r.resume();
      if (!done) { done = true; resolve(collectAgentStatus(gw, ms)); }
    });
    probe.on('error', () => { if (!done) { done = true; resolve(collectAgentStatus(false, null)); } });
    probe.setTimeout(2000, () => { probe.destroy(); if (!done) { done = true; resolve(collectAgentStatus(false, null)); } });
    probe.end();
  });
}

// Push status to Supabase (runs locally every 30s)
async function pushStatusToSupabase() {
  try {
    const data = await probeAndCollect();
    await supabase.from('agent_status').upsert({ id: 'main', data, updated_at: new Date().toISOString() });
  } catch (e) { /* silent — don't crash the server */ }
}

// ─── API: Agent Status ────────────────────────────────────────────────────────
app.get('/api/agent-status', requireAuth, async (req, res) => {
  if (IS_VERCEL) {
    try {
      const { data, error } = await supabase.from('agent_status').select('data, updated_at').eq('id', 'main').single();
      if (error || !data) return res.json({ gateway: false, _cloud: true, _error: 'No status in Supabase yet — is local server running?' });
      const ageMs = Date.now() - new Date(data.updated_at).getTime();
      const stale = ageMs > 120_000;
      return res.json({ ...data.data, _cloud: true, _stale: stale, _ageSeconds: Math.round(ageMs / 1000) });
    } catch (e) {
      return res.json({ gateway: false, _cloud: true, _error: e.message });
    }
  }

  const data = await probeAndCollect();
  res.json(data);
});

// ─── API: OpenClaw Control ────────────────────────────────────────────────────
const OPENCLAW_PS1 = 'C:\\Users\\mohan\\AppData\\Roaming\\npm\\openclaw.ps1';
const NODE_EXE    = process.execPath;

app.post('/api/openclaw/control', requireAuth, (req, res) => {
  if (IS_VERCEL) return res.json({ ok: false, output: '⚠️ Gateway control not available in cloud mode.\nUse localhost:3000 to control the gateway.' });
  const { action } = req.body;
  if (!['start','stop','status'].includes(action)) return res.status(400).json({ error: 'Invalid action' });

  const subCmd = action === 'start' ? 'gateway start'
               : action === 'stop'  ? 'gateway stop'
               :                      'gateway status';

  const openclawPaths = [
    path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'node_modules', 'openclaw', 'openclaw.mjs'),
    path.join(os.homedir(), '.npm-global', 'lib', 'node_modules', 'openclaw', 'openclaw.mjs'),
    'openclaw',
  ];
  const openclawMjs = openclawPaths.find(p => p === 'openclaw' || fs.existsSync(p)) || openclawPaths[0];
  const isFullPath = openclawMjs !== 'openclaw';
  const cmd = isFullPath
    ? `& "${NODE_EXE}" "${openclawMjs}" ${subCmd} 2>&1`
    : `openclaw ${subCmd} 2>&1`;

  let responded = false;
  const safeRespond = (payload) => {
    if (!responded && !res.headersSent) { responded = true; res.json(payload); }
  };

  const safetyTimer = setTimeout(() => {
    safeRespond({ ok: false, action, output: 'Timeout — no response from OpenClaw after 15s. Is it installed?' });
  }, 15000);

  try {
    exec(cmd, { shell: 'powershell.exe', timeout: 13000 }, (err, stdout, stderr) => {
      clearTimeout(safetyTimer);
      const output = ((stdout || '') + (stderr || '')).trim();
      safeRespond({
        ok: !err || action === 'stop',
        action,
        output: output || (err ? err.message : 'Done'),
        error: err?.message || null
      });
    });
  } catch(spawnErr) {
    clearTimeout(safetyTimer);
    safeRespond({ ok: false, action, output: 'Failed to spawn process: ' + spawnErr.message, error: spawnErr.message });
  }
});

// ─── API: Logs ────────────────────────────────────────────────────────────────
app.get('/api/logs', requireAuth, (req, res) => {
  try {
    const logDir  = path.join(os.tmpdir(), 'openclaw');
    const today   = new Date().toISOString().slice(0, 10);
    const logFile = path.join(logDir, `openclaw-${today}.log`);
    if (!fs.existsSync(logFile)) return res.json({ lines: [] });
    const lines = fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean).slice(-60);
    res.json({ lines });
  } catch(e) { res.json({ lines: [`Error: ${e.message}`] }); }
});

// ─── API: Local folder scan ───────────────────────────────────────────────────
app.post('/api/local/scan', requireAuth, (req, res) => {
  const { path: scanPath } = req.body;
  if (!scanPath) return res.status(400).json({ error: 'path is required' });
  try {
    if (!fs.existsSync(scanPath)) return res.status(404).json({ error: `Path not found: ${scanPath}` });
    const entries = fs.readdirSync(scanPath, { withFileTypes: true });

    const EXT_LANG = {
      '.cpp':'.cpp', '.cc':'.cpp', '.cxx':'.cpp', '.h':'.cpp', '.hpp':'.cpp',
      '.cs':'C#', '.js':'JavaScript', '.ts':'TypeScript', '.py':'Python',
      '.java':'Java', '.go':'Go', '.rs':'Rust', '.uproject':'Unreal Engine 5',
      '.unity':'Unity', '.sln':'C#', '.lua':'Lua', '.c':'C',
    };

    const folders = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.') && !['node_modules','__pycache__','.git'].includes(e.name))
      .map(e => {
        const folderPath = path.join(scanPath, e.name);
        let lastModified = null;
        let detectedLang = null;
        const langCounts = {};
        try {
          const stat = fs.statSync(folderPath);
          lastModified = stat.mtime.toISOString();
          const subEntries = fs.readdirSync(folderPath, { withFileTypes: true });
          for (const sub of subEntries) {
            if (!sub.isFile()) continue;
            const ext = path.extname(sub.name).toLowerCase();
            const lang = EXT_LANG[ext];
            if (lang) langCounts[lang] = (langCounts[lang] || 0) + 1;
            if (['.uproject', '.unity', '.sln'].includes(ext)) {
              detectedLang = EXT_LANG[ext];
            }
          }
          if (!detectedLang && Object.keys(langCounts).length) {
            detectedLang = Object.entries(langCounts).sort((a,b) => b[1]-a[1])[0][0];
          }
        } catch {}
        return { name: e.name, path: folderPath, lastModified, detectedLang };
      });

    res.json({ folders });
  } catch(e) {
    res.status(500).jsson({ error: e.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  const ifaces = os.networkInterfaces();
  let localIP = 'localhost';
  Object.values(ifaces).flat().forEach(i => { if (i.family === 'IPv4' && !i.internal) localIP = i.address; });
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║       🚀  MISSION CONTROL  — ONLINE          ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Local:   http://localhost:${PORT}              ║`);
  console.log(`║  Network: http://${localIP}:${PORT}         ║`);
  console.log('╚══════════════════════════════════════════════╝\n');

  pushStatusToSupabase();
  setInterval(pushStatusToSupabase, 30_000);
  console.log('📡 Agent status sync to Supabase started (every 30s)');
});