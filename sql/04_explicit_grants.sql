-- ============================================================
-- Outcomer: Explicit Data API grants
-- Required by Supabase starting October 30 2026 (all projects)
-- Run this in the Supabase SQL editor
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.outcomes     TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dependencies TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pages        TO anon, authenticated;
