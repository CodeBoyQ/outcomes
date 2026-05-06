-- ============================================================
-- Outcomer: Enable Row Level Security
-- Run this in the Supabase SQL editor
-- ============================================================
-- The app currently has no authentication, so all requests use
-- the anon role. These policies allow full access via the anon
-- key while satisfying RLS being enabled. When auth is added,
-- replace these with user-scoped policies.

-- pages
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon full access" ON pages
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- outcomes
ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon full access" ON outcomes
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- dependencies
ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon full access" ON dependencies
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);
