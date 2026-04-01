-- ============================================================
-- OSHA MCP Server - Complete Database Setup
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/xttiryyhcmzitbgvomvm/sql
-- ============================================================

-- NOTE: Do NOT drop existing tables if you already have data.
-- These functions are additive and won't affect existing data.

-- ============================================================
-- RPC: Free quota tracking (3 per IP per day)
-- ============================================================
CREATE OR REPLACE FUNCTION check_free_quota(
  req_ip TEXT,
  req_tool TEXT
) RETURNS JSONB AS $$
DECLARE
  v_count INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  INSERT INTO free_api_quota (ip_address, date, lookup_count)
  VALUES (req_ip, v_today, 0)
  ON CONFLICT (ip_address, date) DO NOTHING;

  SELECT lookup_count INTO v_count
  FROM free_api_quota
  WHERE ip_address = req_ip AND date = v_today;

  IF v_count >= 3 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0
    );
  END IF;

  UPDATE free_api_quota
  SET lookup_count = lookup_count + 1, last_lookup_at = NOW()
  WHERE ip_address = req_ip AND date = v_today;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', 3 - (v_count + 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RPC: Full-text search for OSHA standards
-- ============================================================
CREATE OR REPLACE FUNCTION search_standards(
  search_query TEXT,
  scope_filter TEXT DEFAULT NULL,
  result_limit INT DEFAULT 5
) RETURNS TABLE (
  standard_number TEXT,
  title TEXT,
  subpart TEXT,
  scope TEXT,
  plain_summary TEXT,
  key_requirements JSONB,
  ppe_requirements JSONB,
  ecfr_url TEXT,
  common_violations JSONB
) AS $$
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
    s.common_violations
  FROM osha_standards s
  WHERE
    to_tsvector('english',
      COALESCE(s.title, '') || ' ' ||
      COALESCE(s.plain_summary, '') || ' ' ||
      COALESCE(s.key_requirements::text, '') || ' ' ||
      COALESCE(s.ppe_requirements::text, '')
    ) @@ plainto_tsquery('english', search_query)
    OR s.title ILIKE '%' || search_query || '%'
    OR s.plain_summary ILIKE '%' || search_query || '%'
    OR s.standard_number ILIKE '%' || search_query || '%'
    OR EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(s.keywords) kw
      WHERE kw::text ILIKE '%' || search_query || '%'
    )
    AND (scope_filter IS NULL OR s.scope = scope_filter)
  ORDER BY
    ts_rank(
      to_tsvector('english',
        COALESCE(s.title, '') || ' ' || COALESCE(s.plain_summary, '')
      ),
      plainto_tsquery('english', search_query)
    ) DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- RPC: PPE requirements search
-- ============================================================
CREATE OR REPLACE FUNCTION search_ppe(
  search_query TEXT,
  result_limit INT DEFAULT 10
) RETURNS TABLE (
  standard_number TEXT,
  title TEXT,
  scope TEXT,
  ppe_requirements JSONB,
  plain_summary TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.standard_number,
    s.title,
    s.scope,
    s.ppe_requirements,
    s.plain_summary
  FROM osha_standards s
  WHERE
    s.ppe_requirements IS NOT NULL
    AND (
      s.title ILIKE '%' || search_query || '%'
      OR s.plain_summary ILIKE '%' || search_query || '%'
      OR s.ppe_requirements::text ILIKE '%' || search_query || '%'
      OR EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(s.applicable_hazards) h
        WHERE h::text ILIKE '%' || search_query || '%'
      )
    )
  ORDER BY
    CASE WHEN s.scope = 'construction' AND (
      search_query ILIKE '%weld%' OR search_query ILIKE '%construct%'
    ) THEN 0 ELSE 1 END
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;
