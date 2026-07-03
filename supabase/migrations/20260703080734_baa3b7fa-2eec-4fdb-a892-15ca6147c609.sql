ALTER TABLE public.business_accounts
  ADD COLUMN IF NOT EXISTS amenities text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS primary_action text,
  ADD COLUMN IF NOT EXISTS show_opening_hours boolean NOT NULL DEFAULT false;