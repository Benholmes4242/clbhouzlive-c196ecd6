ALTER TABLE public.sr_world_rankings ADD COLUMN IF NOT EXISTS ranking_type text NOT NULL DEFAULT 'wgr';
UPDATE public.sr_world_rankings SET ranking_type = 'wgr' WHERE ranking_type IS NULL;

-- Replace unique constraint (player_id, ranking_date) -> (player_id, ranking_date, ranking_type)
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.sr_world_rankings'::regclass
    AND contype = 'u'
    AND pg_get_constraintdef(oid) ILIKE '%(player_id, ranking_date)%';
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.sr_world_rankings DROP CONSTRAINT %I', cname);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS sr_world_rankings_player_date_type_uidx
  ON public.sr_world_rankings (player_id, ranking_date, ranking_type);

CREATE INDEX IF NOT EXISTS sr_world_rankings_type_date_idx
  ON public.sr_world_rankings (ranking_type, ranking_date DESC);