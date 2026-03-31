-- ============================================
-- OSHA MCP Server Database Schema v2
-- ============================================

-- Drop existing tables if re-running
DROP TABLE IF EXISTS api_usage CASCADE;
DROP TABLE IF EXISTS naics_standards CASCADE;
DROP TABLE IF EXISTS ppe_mappings CASCADE;
DROP TABLE IF EXISTS penalty_schedule CASCADE;
DROP TABLE IF EXISTS osha_standards CASCADE;

-- Core standards table
CREATE TABLE osha_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  standard_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subpart TEXT,
  part TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('general_industry', 'construction')),
  raw_text TEXT NOT NULL,
  plain_summary TEXT,
  key_requirements JSONB DEFAULT '[]',
  applicable_hazards JSONB DEFAULT '[]',
  ppe_requirements JSONB DEFAULT '[]',
  common_violations JSONB DEFAULT '[]',
  related_standards JSONB DEFAULT '[]',
  ecfr_url TEXT,
  last_amended DATE,
  keywords JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search index
CREATE INDEX idx_standards_fts ON osha_standards
  USING gin(to_tsvector('english', 
    COALESCE(title, '') || ' ' || 
    COALESCE(plain_summary, '') || ' ' || 
    COALESCE(raw_text, '')
  ));

CREATE INDEX idx_standards_keywords ON osha_standards USING gin(keywords);
CREATE INDEX idx_standards_number ON osha_standards(standard_number);
CREATE INDEX idx_standards_part ON osha_standards(part);
CREATE INDEX idx_standards_scope ON osha_standards(scope);

-- Penalty schedule table
CREATE TABLE penalty_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_type TEXT NOT NULL,
  min_penalty NUMERIC,
  max_penalty NUMERIC,
  effective_date DATE NOT NULL,
  notes TEXT
);

-- PPE mapping table
CREATE TABLE ppe_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hazard_category TEXT NOT NULL,
  task_description TEXT,
  required_ppe JSONB NOT NULL,
  standard_number TEXT,
  notes TEXT
);

-- NAICS to applicable standards mapping
CREATE TABLE naics_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  naics_code TEXT NOT NULL,
  industry_description TEXT,
  applicable_standards JSONB NOT NULL,
  notes TEXT
);

-- API usage tracking
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT,
  tool_name TEXT NOT NULL,
  query TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  response_time_ms INTEGER
);

-- ============================================
-- RPC Functions
-- ============================================

CREATE FUNCTION search_standards(search_query TEXT, scope_filter TEXT DEFAULT NULL, result_limit INT DEFAULT 5)
RETURNS TABLE (
  standard_number TEXT,
  title TEXT,
  subpart TEXT,
  scope TEXT,
  plain_summary TEXT,
  key_requirements JSONB,
  ppe_requirements JSONB,
  ecfr_url TEXT,
  rank REAL
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.standard_number,
    s.title,
    s.subpart,
    s.scope,
    s.plain_summary,
    s.key_requirements,
    s.ppe_requirements,
    s.ecfr_url,
    ts_rank(
      to_tsvector('english', 
        COALESCE(s.title, '') || ' ' || 
        COALESCE(s.plain_summary, '') || ' ' || 
        COALESCE(s.raw_text, '')
      ),
      plainto_tsquery('english', search_query)
    ) AS rank
  FROM osha_standards s
  WHERE
    to_tsvector('english', 
      COALESCE(s.title, '') || ' ' || 
      COALESCE(s.plain_summary, '') || ' ' || 
      COALESCE(s.raw_text, '')
    ) @@ plainto_tsquery('english', search_query)
    AND (scope_filter IS NULL OR s.scope = scope_filter)
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION search_ppe(search_query TEXT, result_limit INT DEFAULT 10)
RETURNS TABLE (
  standard_number TEXT,
  title TEXT,
  ppe_requirements JSONB,
  applicable_hazards JSONB,
  plain_summary TEXT,
  ecfr_url TEXT
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.standard_number,
    s.title,
    s.ppe_requirements,
    s.applicable_hazards,
    s.plain_summary,
    s.ecfr_url
  FROM osha_standards s
  WHERE
    jsonb_array_length(COALESCE(s.ppe_requirements, '[]'::jsonb)) > 0
    AND to_tsvector('english', 
      COALESCE(s.title, '') || ' ' || 
      COALESCE(s.plain_summary, '') || ' ' ||
      COALESCE(s.raw_text, '')
    ) @@ plainto_tsquery('english', search_query)
  ORDER BY ts_rank(
    to_tsvector('english', 
      COALESCE(s.title, '') || ' ' || 
      COALESCE(s.plain_summary, '')
    ),
    plainto_tsquery('english', search_query)
  ) DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE osha_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalty_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE ppe_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE naics_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read" ON osha_standards FOR SELECT USING (true);
CREATE POLICY "anon_read" ON penalty_schedule FOR SELECT USING (true);
CREATE POLICY "anon_read" ON ppe_mappings FOR SELECT USING (true);
CREATE POLICY "anon_read" ON naics_standards FOR SELECT USING (true);
CREATE POLICY "anon_insert_usage" ON api_usage FOR INSERT WITH CHECK (true);

-- Data loading policies (restrict these after initial load)
CREATE POLICY "anon_insert" ON osha_standards FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update" ON osha_standards FOR UPDATE USING (true);
CREATE POLICY "anon_insert" ON penalty_schedule FOR INSERT WITH (true);
CREATE POLICY "anon_insert" ON ppe_mappings FOR INSERT WITH (true);
CREATE POLICY "anon_insert" ON naics_standards FOR INSERT WITH (true);

SELECT 'OSHA MCP database setup complete' AS status;
