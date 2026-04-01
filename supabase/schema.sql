-- Mission Control — Supabase Schema
-- Run this in your Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/ynlnajsxwxpmsojqkpvs/sql

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  engine TEXT,
  status TEXT DEFAULT 'Active',
  description TEXT,
  tags JSONB DEFAULT '[]',
  repo_url TEXT DEFAULT '',
  progress INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project tasks
CREATE TABLE IF NOT EXISTS project_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project inline notes
CREATE TABLE IF NOT EXISTS project_notes (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- General notes / dev diary
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task queue
CREATE TABLE IF NOT EXISTS queue (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'queued',
  priority TEXT DEFAULT 'medium',
  project TEXT,
  result TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration (run if table already exists):
-- ALTER TABLE queue ADD COLUMN IF NOT EXISTS result TEXT;
-- ALTER TABLE queue ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Settings (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- Agent status (pushed by local server every 30s, read by Vercel)
CREATE TABLE IF NOT EXISTS agent_status (
  id TEXT PRIMARY KEY DEFAULT 'main',
  data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (optional but good practice — disable for now since we use JWT at app level)
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- etc.
