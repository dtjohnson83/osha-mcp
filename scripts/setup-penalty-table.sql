CREATE TABLE IF NOT EXISTS penalty_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_type TEXT UNIQUE NOT NULL,
  description TEXT,
  max_penalty INTEGER NOT NULL DEFAULT 0,
  min_penalty INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  standards TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'general',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE penalty_schedule DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_penalty_category ON penalty_schedule(category);
CREATE INDEX IF NOT EXISTS idx_penalty_standards ON penalty_schedule USING GIN(standards);
