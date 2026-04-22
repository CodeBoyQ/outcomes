-- ============================================================
-- Outcomer: Initial schema
-- Run this on a fresh Supabase project
-- ============================================================

CREATE TABLE outcomes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text        NOT NULL DEFAULT 'New outcome',
  status     text        NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'wait', 'inprogress', 'done')),
  strategy   text        NOT NULL DEFAULT '',
  info       text        NOT NULL DEFAULT '',
  deadline   text,
  position_x float8      NOT NULL DEFAULT 0,
  position_y float8      NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE dependencies (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_outcome_id  uuid NOT NULL REFERENCES outcomes(id) ON DELETE CASCADE,
  to_outcome_id    uuid NOT NULL REFERENCES outcomes(id) ON DELETE CASCADE,
  UNIQUE (from_outcome_id, to_outcome_id)
);
