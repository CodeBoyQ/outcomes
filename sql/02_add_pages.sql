-- ============================================================
-- Outcomer: Pages migration
-- Run this in the Supabase SQL editor
-- ============================================================

-- 1. Create pages table
CREATE TABLE pages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL DEFAULT 'Untitled page',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Add page_id to outcomes (nullable first, so existing rows don't fail)
ALTER TABLE outcomes
  ADD COLUMN page_id uuid REFERENCES pages(id) ON DELETE CASCADE;

-- 3. Migrate existing outcomes into a default page
DO $$
DECLARE
  default_page_id uuid;
BEGIN
  -- Only run if there are outcomes without a page
  IF EXISTS (SELECT 1 FROM outcomes WHERE page_id IS NULL) THEN
    INSERT INTO pages (name) VALUES ('My outcomes')
    RETURNING id INTO default_page_id;

    UPDATE outcomes SET page_id = default_page_id WHERE page_id IS NULL;
  END IF;
END $$;

-- 4. Now make page_id required
ALTER TABLE outcomes
  ALTER COLUMN page_id SET NOT NULL;

-- 5. Index for fast page-scoped queries
CREATE INDEX outcomes_page_id_idx ON outcomes(page_id);
