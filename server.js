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

[DATA_DIR, UPLOADS_DIR, CHAT_UPLOADS_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const upload     = multer({ dest: UPLOADS_DIR });
const chatUpload = multer({ dest: CHAT_UPLOADS_DIR, limits: { fileSize: 5 * 1024 * 1024 } });

// ─── Token stats (accumulated from chat calls) ────────────────────────────────
let _tokenStats = { tokensIn: 0, tokensOut: 0, cacheTokens: 0, calls: 0, startedAt: Date.now() };

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

// ─── Seed data ────────────────────────────────────────────────────────────────

function seedProjects() {
  if (!fs.existsSync(path.join(DATA_DIR, 'projects.json'))) {
    const projects = [
      { id: uid(), name: 'TazUE', engine: 'Unreal Engine 5', status: 'Active', description: 'Team project of 10 at UQAT. Platformer with custom Taz movement component. Uses Perforce + local backup.', tags: ['school', 'team', 'UE5'], repoUrl: '', progress: 60, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tasks: [
          { id: uid(), title: 'Fix cheese stack memory leak', status: 'done', priority: 'high', createdAt: new Date().toISOString() },
          { id: uid(), title: 'Fix coyote time not reading from preset', status: 'done', priority: 'high', createdAt: new Date().toISOString() },
          { id: uid(), title: 'Fix UpdateTazState using GetMaxSpeed instead of actual velocity', status: 'done', priority: 'high', createdAt: new Date().toISOString() },
          { id: uid(), title: 'Extract duplicate wall-sweep code to helper', status: 'todo', priority: 'medium', createdAt: new Date().toISOString() },
          { id: uid(), title: 'Fix Look() camera smoothing (interpolates from 0 each frame)', status: 'todo', priority: 'medium', createdAt: new Date().toISOString() }
        ], notes: [] },
      { id: uid(), name: 'NightboundSurvivor', engine: 'Unreal Engine 5', status: 'Active', description: 'Personal UE5 survivor-style game project.', tags: ['personal', 'UE5', 'survivor'], repoUrl: '', progress: 25, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tasks: [], notes: [] },
      { id: uid(), name: 'Counterforce', engine: 'Unreal Engine 5', status: 'Paused', description: 'School project built in UE5.', tags: ['school', 'UE5'], repoUrl: '', progress: 80, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tasks: [], notes: [] },
      { id: uid(), name: 'AlgoQuest', engine: 'C++', status: 'Active', description: 'Algorithm and data structures C++ project.', tags: ['school', 'cpp', 'algorithms'], repoUrl: '', progress: 40, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tasks: [], notes: [] },
      { id: uid(), name: 'PGJ1303', engine: 'C++ / SFML', status: 'Active', description: 'School exercises using SFML and ImGui.', tags: ['school', 'cpp', 'sfml', 'imgui'], repoUrl: '', progress: 50, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tasks: [], notes: [] },
      { id: uid(), name: 'DrawOnConsole', engine: 'C++', status: 'Paused', description: 'Console drawing utility in C++.', tags: ['personal', 'cpp'], repoUrl: '', progress: 70, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tasks: [], notes: [] },
      { id: uid(), name: 'EndlessRunner', engine: 'Unity', status: 'Complete', description: 'Unity endless runner game.', tags: ['personal', 'unity'], repoUrl: '', progress: 100, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tasks: [], notes: [] },
      { id: uid(), name: 'NecroNightmare', engine: 'Unity', status: 'Paused', description: 'Unity horror game project.', tags: ['personal', 'unity', 'horror'], repoUrl: '', progress: 30, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tasks: [], notes: [] },
      { id: uid(), name: 'GameJam2025', engine: 'Unity', status: 'Complete', description: '2025 game jam submission built in Unity.', tags: ['gamejam', 'unity'], repoUrl: '', progress: 100, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tasks: [], notes: [] },
      { id: uid(), name: 'CarMathProject', engine: 'Unity', status: 'Complete', description: 'Math visualization with Unity - car physics.', tags: ['school', 'unity', 'math'], repoUrl: '', progress: 100, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tasks: [], notes: [] },
    ];
    writeJSON('projects.json', projects);
  }
}

function seedNotes() {
  if (!fs.existsSync(path.join(DATA_DIR, 'notes.json'))) {
    writeJSON('notes.json', [
      { id: uid(), title: 'Mission Control setup', content: 'Dashboard initialized. All projects pre-loaded. OpenClaw connected.', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: ['meta'] }
    ]);
  }
}

function seedSettings() {
  if (!fs.existsSync(path.join(DATA_DIR, 'settings.json'))) {
    writeJSON('settings.json', {
      theme: 'dark', ownerName: 'Shadow', ownerHandle: 'shadow9887',
      accentColor: '#58a6ff', language: 'en', compactMode: false,
      autoRefresh: true, autoRefreshInterval: 30, defaultPage: 'dashboard',
      dateFormat: 'relative', sidebarCollapsed: false, chatUploadEnabled: true
    });
  }
}

function seedQueue() {
  if (!fs.existsSync(path.join(DATA_DIR, 'queue.json'))) {
    writeJSON('queue.json', [
      { id: uid(), title: 'Fix Look() smoothing bug in TazMovementComponent', status: 'queued', priority: 'medium', project: 'TazUE', createdAt: new Date().toISOString() },
      { id: uid(), title: 'Review SimpleCharacter.cpp for FBaseMovementStats TOptional bug', status: 'queued', priority: 'medium', project: 'TazUE', createdAt: new Date().toISOString() },
    ]);
  }
}

function seedTasks() {
  if (!fs.existsSync(path.join(DATA_DIR, 'tasks.json'))) writeJSON('tasks.json', []);
}

seedProjects(); seedNotes(); seedSettings(); seedQueue(); seedTasks();

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
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*, project_tasks(*), project_notes(*)')
      .order('created_at', { ascending: true });
    if (error) throw error;
    const projects = (data || []).map(p => ({
      ...p,
      tasks: p.project_tasks || [],
      notes: p.project_notes || [],
      project_tasks: undefined,
      project_notes: undefined
    }));
    res.json(projects);
  } catch(e) {
    // fallback to JSON if Supabase not configured
    res.json(readJSON('projects.json'));
  }
});
app.post('/api/projects', requireAuth, async (req, res) => {
  try {
    const p = { id: uid(), tags: [], progress: 0, repo_url: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...req.body };
    const { data, error } = await supabase.from('projects').insert([p]).select().single();
    if (error) throw error;
    res.json({ ...data, tasks: [], notes: [] });
  } catch(e) {
    const projects = readJSON('projects.json');
    const p = { id: uid(), tasks: [], notes: [], progress: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...req.body };
    projects.push(p); writeJSON('projects.json', projects); res.json(p);
  }
});
app.get('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('projects').select('*, project_tasks(*), project_notes(*)').eq('id', req.params.id).single();
    if (error) throw error;
    res.json({ ...data, tasks: data.project_tasks || [], notes: data.project_notes || [], project_tasks: undefined, project_notes: undefined });
  } catch(e) {
    const p = readJSON('projects.json').find(x => x.id === req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' }); res.json(p);
  }
});
app.put('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    delete updates.tasks; delete updates.notes; delete updates.project_tasks; delete updates.project_notes;
    const { data, error } = await supabase.from('projects').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch(e) {
    const projects = readJSON('projects.json');
    const i = projects.findIndex(x => x.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: 'Not found' });
    projects[i] = { ...projects[i], ...req.body, id: req.params.id, updatedAt: new Date().toISOString() };
    writeJSON('projects.json', projects); res.json(projects[i]);
  }
});
app.delete('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('projects').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch(e) {
    writeJSON('projects.json', readJSON('projects.json').filter(x => x.id !== req.params.id)); res.json({ ok: true });
  }
});
app.post('/api/projects/:id/tasks', requireAuth, async (req, res) => {
  try {
    const task = { id: uid(), project_id: req.params.id, status: 'todo', priority: 'medium', created_at: new Date().toISOString(), ...req.body };
    const { data, error } = await supabase.from('project_tasks').insert([task]).select().single();
    if (error) throw error;
    res.json(data);
  } catch(e) {
    const projects = readJSON('projects.json');
    const p = projects.find(x => x.id === req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    const task = { id: uid(), status: 'todo', priority: 'medium', createdAt: new Date().toISOString(), ...req.body };
    p.tasks.push(task); p.updatedAt = new Date().toISOString(); p.progress = calcProgress(p.tasks);
    writeJSON('projects.json', projects); res.json(task);
  }
});
app.put('/api/projects/:id/tasks/:taskId', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('project_tasks').update(req.body).eq('id', req.params.taskId).select().single();
    if (error) throw error;
    res.json(data);
  } catch(e) {
    const projects = readJSON('projects.json');
    const p = projects.find(x => x.id === req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    const ti = p.tasks.findIndex(t => t.id === req.params.taskId);
    if (ti === -1) return res.status(404).json({ error: 'Task not found' });
    p.tasks[ti] = { ...p.tasks[ti], ...req.body, id: req.params.taskId };
    p.progress = calcProgress(p.tasks); p.updatedAt = new Date().toISOString();
    writeJSON('projects.json', projects); res.json(p.tasks[ti]);
  }
});
app.delete('/api/projects/:id/tasks/:taskId', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('project_tasks').delete().eq('id', req.params.taskId);
    if (error) throw error;
    res.json({ ok: true });
  } catch(e) {
    const projects = readJSON('projects.json');
    const p = projects.find(x => x.id === req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    p.tasks = p.tasks.filter(t => t.id !== req.params.taskId);
    p.progress = calcProgress(p.tasks); p.updatedAt = new Date().toISOString();
    writeJSON('projects.json', projects); res.json({ ok: true });
  }
});

// ─── API: Notes ───────────────────────────────────────────────────────────────
app.get('/api/notes', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('notes').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch(e) { res.json(readJSON('notes.json')); }
});
app.post('/api/notes', requireAuth, async (req, res) => {
  try {
    const n = { id: uid(), tags: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...req.body };
    const { data, error } = await supabase.from('notes').insert([n]).select().single();
    if (error) throw error;
    res.json(data);
  } catch(e) {
    const notes = readJSON('notes.json');
    const n = { id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: [], ...req.body };
    notes.unshift(n); writeJSON('notes.json', notes); res.json(n);
  }
});
app.put('/api/notes/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('notes').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch(e) {
    const notes = readJSON('notes.json');
    const i = notes.findIndex(x => x.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: 'Not found' });
    notes[i] = { ...notes[i], ...req.body, id: req.params.id, updatedAt: new Date().toISOString() };
    writeJSON('notes.json', notes); res.json(notes[i]);
  }
});
app.delete('/api/notes/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('notes').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch(e) {
    writeJSON('notes.json', readJSON('notes.json').filter(x => x.id !== req.params.id)); res.json({ ok: true });
  }
});

// ─── API: Queue ───────────────────────────────────────────────────────────────
app.get('/api/queue', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('queue').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch(e) { res.json(readJSON('queue.json')); }
});
app.post('/api/queue', requireAuth, async (req, res) => {
  try {
    const item = { id: uid(), status: 'queued', priority: 'medium', created_at: new Date().toISOString(), ...req.body };
    const { data, error } = await supabase.from('queue').insert([item]).select().single();
    if (error) throw error;
    res.json(data);
  } catch(e) {
    const queue = readJSON('queue.json');
    const item = { id: uid(), status: 'queued', priority: 'medium', createdAt: new Date().toISOString(), ...req.body };
    queue.push(item); writeJSON('queue.json', queue); res.json(item);
  }
});
app.put('/api/queue/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('queue').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch(e) {
    const queue = readJSON('queue.json');
    const i = queue.findIndex(x => x.id === req.params.id);
    if (i === -1) return res.status(404).json({ error: 'Not found' });
    queue[i] = { ...queue[i], ...req.body, id: req.params.id };
    writeJSON('queue.json', queue); res.json(queue[i]);
  }
});
app.delete('/api/queue/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('queue').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch(e) {
    writeJSON('queue.json', readJSON('queue.json').filter(x => x.id !== req.params.id)); res.json({ ok: true });
  }
});

// ─── API: Settings ────────────────────────────────────────────────────────────
app.get('/api/settings', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) throw error;
    const settings = {};
    (data || []).forEach(row => { settings[row.key] = row.value; });
    if (!Object.keys(settings).length) {
      return res.json({ theme: 'dark', ownerName: 'Shadow', ownerHandle: 'shadow9887', accentColor: '#58a6ff', language: 'en', compactMode: false, autoRefresh: true, autoRefreshInterval: 30, defaultPage: 'dashboard', dateFormat: 'relative', sidebarCollapsed: false, chatUploadEnabled: true });
    }
    res.json(settings);
  } catch(e) { res.json(readJSON('settings.json', {})); }
});
app.put('/api/settings', requireAuth, async (req, res) => {
  try {
    const rows = Object.entries(req.body).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' });
    if (error) throw error;
    res.json(req.body);
  } catch(e) {
    const s = { ...readJSON('settings.json', {}), ...req.body };
    writeJSON('settings.json', s); res.json(s);
  }
});

// ─── API: Uploads ─────────────────────────────────────────────────────────────
app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ ok: true, filename: req.file.originalname, size: req.file.size, path: req.file.path });
});
app.get('/api/uploads', (req, res) => {
  if (!fs.existsSync(UPLOADS_DIR)) return res.json([]);
  const files = fs.readdirSync(UPLOADS_DIR)
    .filter(f => !fs.statSync(path.join(UPLOADS_DIR, f)).isDirectory())
    .map(f => ({ name: f, size: fs.statSync(path.join(UPLOADS_DIR, f)).size }));
  res.json(files);
});

// ─── API: Chat file upload ────────────────────────────────────────────────────
app.post('/api/chat/upload', chatUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  let content = '';
  try {
    const buf = fs.readFileSync(req.file.path);
    content = buf.toString('utf8');
    // If it looks binary, truncate or note
    if (content.includes('\0')) content = '[Binary file — cannot display as text]';
    else if (content.length > 20000) content = content.slice(0, 20000) + '\n\n[...truncated at 20k chars]';
  } catch { content = '[Could not read file]'; }
  res.json({ ok: true, name: req.file.originalname, size: req.file.size, content });
});

// ─── API: Stats ───────────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const projects = readJSON('projects.json');
  const queue    = readJSON('queue.json');
  const notes    = readJSON('notes.json');
  const tasks    = readJSON('tasks.json');
  const totalTasks = projects.reduce((a, p) => a + (p.tasks?.length || 0), 0);
  const doneTasks  = projects.reduce((a, p) => a + (p.tasks?.filter(t => t.status === 'done').length || 0), 0);
  res.json({
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'Active').length,
    totalTasks, doneTasks,
    queuedItems: queue.filter(q => q.status === 'queued').length,
    pendingTasks: tasks.filter(t => t.status === 'queued').length,
    totalNotes: notes.length,
  });
});

// ─── API: Tasks ───────────────────────────────────────────────────────────────
app.get('/api/tasks', (req, res) => res.json(readJSON('tasks.json')));
app.post('/api/tasks', (req, res) => {
  const tasks = readJSON('tasks.json');
  const t = { id: uid(), status: 'queued', progress: 0, createdAt: new Date().toISOString(), ...req.body };
  tasks.push(t); writeJSON('tasks.json', tasks); res.json(t);
});
app.put('/api/tasks/:id', (req, res) => {
  const tasks = readJSON('tasks.json');
  const i = tasks.findIndex(t => t.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: 'Not found' });
  tasks[i] = { ...tasks[i], ...req.body, id: req.params.id };
  writeJSON('tasks.json', tasks); res.json(tasks[i]);
});
app.delete('/api/tasks/:id', (req, res) => {
  writeJSON('tasks.json', readJSON('tasks.json').filter(t => t.id !== req.params.id)); res.json({ ok: true });
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
      // Parse usage stats from response
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
  proxyReq.on('error', (e) => res.status(502).json({ error: 'Gateway unreachable: ' + e.message }));
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

    // Active = most recently used profile not on cooldown
    let activeProfile = null, latestUse = 0;
    for (const [name, p] of Object.entries(result)) {
      if (p.lastUsed && p.lastUsed > latestUse && !p.onCooldown) {
        latestUse = p.lastUsed;
        activeProfile = name;
      }
    }

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

    const todayPrefix = new Date().toISOString().slice(0, 10); // "2026-03-11"
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
    if (!fs.existsSync(SESSIONS_FILE)) return { sessions: [], discord: null, rateLimitAt: null, resetInSeconds: null };

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
      if (key.includes('discord'))              channel = 'discord';
      else if (key.includes('openai-user:mission')) channel = 'mission-control';
      else if (key.includes('openai'))          channel = 'api';

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

    return { sessions, discord, rateLimitAt, resetInSeconds };
  } catch(e) {
    return { sessions: [], discord: null, rateLimitAt: null, resetInSeconds: null, error: e.message };
  }
}

// ─── API: Agent Status ────────────────────────────────────────────────────────
app.get('/api/agent-status', requireAuth, (req, res) => {
  // Probe gateway
  let gateway = false;
  let gatewayMs = null;
  let sent = false;
  const t0 = Date.now();
  const probe = http.request({ hostname: '127.0.0.1', port: 18789, path: '/', method: 'HEAD' }, (r) => {
    gateway = r.statusCode < 500;
    gatewayMs = Date.now() - t0;
    r.resume();
    if (!sent) { sent = true; sendStatus(); }
  });
  probe.on('error', () => { if (!sent) { sent = true; sendStatus(); } });
  probe.setTimeout(2000, () => { probe.destroy(); gateway = false; if (!sent) { sent = true; sendStatus(); } });
  probe.end();

  function sendStatus() {
    const clawStatus   = parseOpenclawStatus();
    const discord      = clawStatus.discord;
    const todayUsage   = getTodayUsage();
    const authProfiles = getAuthProfiles();
    const settings     = readJSON('settings.json', {});
    const dailyBudget  = settings.dailyTokenBudget || 500000;

    // Cost estimate from dashboard chat calls
    const costIn  = (_tokenStats.tokensIn  / 1_000_000) * 3;
    const costOut = (_tokenStats.tokensOut / 1_000_000) * 15;
    const estCost = (_tokenStats.calls > 0) ? (costIn + costOut).toFixed(4) : null;
    const uptimeMins = Math.round((Date.now() - _tokenStats.startedAt) / 60000);

    res.json({
      gateway, gatewayMs,
      model: 'claude-sonnet-4-6',
      // Discord session (main session)
      discord: discord ? {
        tokensUsed:   discord.used,
        tokensTotal:  discord.total,
        pct:          discord.pct,
        cacheHitRate: discord.cacheRate,
        age:          discord.ageLabel,
        inputTokens:  discord.inputTokens,
        outputTokens: discord.outputTokens,
        cacheRead:    discord.cacheRead,
        model:        discord.model
      } : null,
      // All sessions
      sessions: clawStatus.sessions,
      // Rate limit
      rateLimitAt: clawStatus.rateLimitAt,
      resetInSeconds: clawStatus.resetInSeconds,
      // Today's token usage across ALL sessions
      today: todayUsage ? {
        inputFresh:  todayUsage.inputFresh,
        outputFresh: todayUsage.outputFresh,
        cacheRead:   todayUsage.cacheRead,
        freshTokens: todayUsage.inputFresh + todayUsage.outputFresh,
        totalTokens: todayUsage.totalTokensToday,
        cost:        todayUsage.totalCost,
        calls:       todayUsage.calls,
        budget:      dailyBudget,
        pct:         Math.min(100, Math.round(((todayUsage.inputFresh + todayUsage.outputFresh) / dailyBudget) * 100)),
        remaining:   Math.max(0, dailyBudget - todayUsage.inputFresh - todayUsage.outputFresh)
      } : null,
      dashboardCalls: _tokenStats.calls,
      estimatedCost: estCost,
      uptimeMins,
      apis: authProfiles,
      skills: ['gemini','github','gog','discord','weather','coding-agent','healthcheck','mcporter','skill-creator'],
      updatedAt: new Date().toISOString()
    });
  }
});

// ─── API: OpenClaw Control ────────────────────────────────────────────────────
const OPENCLAW_PS1 = 'C:\\Users\\mohan\\AppData\\Roaming\\npm\\openclaw.ps1';
const NODE_EXE    = process.execPath;

app.post('/api/openclaw/control', requireAuth, (req, res) => {
  const { action } = req.body;
  if (!['start','stop','status'].includes(action)) return res.status(400).json({ error: 'Invalid action' });

  const subCmd = action === 'start' ? 'gateway start'
               : action === 'stop'  ? 'gateway stop'
               :                      'gateway status';

  // Use full path to openclaw PowerShell script
  const cmd = `& "${NODE_EXE}" "C:\\Users\\mohan\\AppData\\Roaming\\npm\\node_modules\\openclaw\\openclaw.mjs" ${subCmd} 2>&1`;

  exec(cmd, { shell: 'powershell.exe', timeout: 12000 }, (err, stdout, stderr) => {
    const output = ((stdout || '') + (stderr || '')).trim();
    res.json({
      ok: !err || action === 'stop',
      action,
      output: output || (err ? err.message : 'Done'),
      error: err?.message
    });
  });
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
});
