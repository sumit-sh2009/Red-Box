CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_id TEXT DEFAULT 'knight',
  banner_color TEXT DEFAULT '#3a86ff',
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'government')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  keywords TEXT NOT NULL DEFAULT '',
  responsibilities TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS clusters (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  category TEXT,
  location_text TEXT,
  ward TEXT,
  size INTEGER NOT NULL DEFAULT 1,
  support_total INTEGER NOT NULL DEFAULT 0,
  department TEXT,
  urgency TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  location_text TEXT NOT NULL DEFAULT '',
  ward TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'pending_ai',
  support_count INTEGER NOT NULL DEFAULT 0,
  cluster_id TEXT,
  tracking_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints (status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints (category);
CREATE INDEX IF NOT EXISTS idx_complaints_cluster ON complaints (cluster_id);
CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints (created_at DESC);

CREATE TABLE IF NOT EXISTS complaint_support (
  user_id TEXT NOT NULL,
  complaint_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, complaint_id)
);

CREATE TABLE IF NOT EXISTS complaint_events (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  status TEXT NOT NULL,
  actor TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_analyses (
  id TEXT PRIMARY KEY,
  complaint_id TEXT NOT NULL,
  workflow_id TEXT,
  model TEXT,
  used_llm BOOLEAN NOT NULL DEFAULT FALSE,
  category TEXT,
  subcategory TEXT,
  severity TEXT,
  urgency TEXT,
  department TEXT,
  department_confidence REAL,
  overall_confidence REAL,
  needs_review BOOLEAN NOT NULL DEFAULT FALSE,
  flagged BOOLEAN NOT NULL DEFAULT FALSE,
  similar_ids TEXT,
  summary TEXT,
  recommended_action TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
