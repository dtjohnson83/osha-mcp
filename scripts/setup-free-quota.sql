-- Free API quota tracking for OSHA MCP
-- Tracks free daily lookups per IP address (3 per day, no auth required)

DROP TABLE IF EXISTS free_api_quota CASCADE;

CREATE TABLE free_api_quota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  lookup_count INTEGER NOT NULL DEFAULT 0,
  last_lookup_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (ip_address, date)
);

CREATE INDEX idx_free_quota_ip_date ON free_api_quota(ip_address, date);

-- RPC: Check and increment free quota. Returns { allowed: boolean, remaining: number }
CREATE OR REPLACE FUNCTION check_free_quota(
  req_ip TEXT,
  req_tool TEXT
) RETURNS JSONB AS $$
DECLARE
  v_remaining INTEGER;
  v_count INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get or create today's record
  INSERT INTO free_api_quota (ip_address, date, lookup_count)
  VALUES (req_ip, v_today, 0)
  ON CONFLICT (ip_address, date) DO NOTHING;

  -- Check current count
  SELECT lookup_count INTO v_count
  FROM free_api_quota
  WHERE ip_address = req_ip AND date = v_today;

  IF v_count >= 3 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'message', 'Free daily quota exceeded. Use x402 payment or wait until tomorrow.'
    );
  END IF;

  -- Increment
  UPDATE free_api_quota
  SET lookup_count = lookup_count + 1, last_lookup_at = NOW()
  WHERE ip_address = req_ip AND date = v_today;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', 3 - (v_count + 1),
    'lookup_number', v_count + 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
