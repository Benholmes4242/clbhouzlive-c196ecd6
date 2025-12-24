-- Add helpful columns for mapping audit/review
ALTER TABLE tourhub_event_mappings
  ADD COLUMN IF NOT EXISTS espn_name text,
  ADD COLUMN IF NOT EXISTS slashgolf_name text,
  ADD COLUMN IF NOT EXISTS confidence numeric,
  ADD COLUMN IF NOT EXISTS matched_at timestamptz DEFAULT now();