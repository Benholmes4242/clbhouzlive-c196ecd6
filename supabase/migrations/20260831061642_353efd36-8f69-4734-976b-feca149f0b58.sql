-- ADDENDUM 1: body becomes an ordered array of typed blocks.
ALTER TABLE public.tour_stories DROP COLUMN body;
ALTER TABLE public.tour_stories
  ADD COLUMN body_blocks jsonb NOT NULL DEFAULT '[]'::jsonb;

-- VALIDATE ON WRITE, not on read: a malformed block is rejected when the story
-- is saved, so a published story can always render. Unknown TYPES are allowed
-- through on purpose (new types must not be blocked by an old constraint) — the
-- client renders nothing for them.
CREATE OR REPLACE FUNCTION public.validate_tour_story_blocks()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  b jsonb;
  t text;
BEGIN
  IF jsonb_typeof(NEW.body_blocks) <> 'array' THEN
    RAISE EXCEPTION 'body_blocks must be a JSON array, got %', jsonb_typeof(NEW.body_blocks);
  END IF;

  FOR b IN SELECT * FROM jsonb_array_elements(NEW.body_blocks) LOOP
    IF jsonb_typeof(b) <> 'object' THEN
      RAISE EXCEPTION 'every body block must be an object, got %', jsonb_typeof(b);
    END IF;

    t := b->>'type';
    IF t IS NULL OR length(btrim(t)) = 0 THEN
      RAISE EXCEPTION 'every body block needs a non-empty type';
    END IF;

    IF t IN ('paragraph', 'heading') THEN
      IF coalesce(btrim(b->>'text'), '') = '' THEN
        RAISE EXCEPTION 'a % block needs text', t;
      END IF;

    ELSIF t = 'image' THEN
      IF coalesce(btrim(b->>'url'), '') = '' THEN
        RAISE EXCEPTION 'an image block needs a url';
      END IF;

    ELSIF t = 'quote' THEN
      IF coalesce(btrim(b->>'text'), '') = '' THEN
        RAISE EXCEPTION 'a quote block needs text';
      END IF;

    ELSIF t = 'leaderboard' THEN
      IF b->>'tournament_id' IS NULL THEN
        RAISE EXCEPTION 'a leaderboard block needs a tournament_id';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.sr_tournaments x WHERE x.id = (b->>'tournament_id')::uuid) THEN
        RAISE EXCEPTION 'leaderboard block references an unknown tournament %', b->>'tournament_id';
      END IF;

    ELSIF t = 'player' THEN
      IF b->>'player_id' IS NULL THEN
        RAISE EXCEPTION 'a player block needs a player_id';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM public.sr_players x WHERE x.id = (b->>'player_id')::uuid) THEN
        RAISE EXCEPTION 'player block references an unknown player %', b->>'player_id';
      END IF;
    END IF;
    -- Any other type passes: old databases must not reject new block types.
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tour_stories_validate_blocks
  BEFORE INSERT OR UPDATE OF body_blocks ON public.tour_stories
  FOR EACH ROW EXECUTE FUNCTION public.validate_tour_story_blocks();

REVOKE EXECUTE ON FUNCTION public.validate_tour_story_blocks() FROM anon, authenticated;