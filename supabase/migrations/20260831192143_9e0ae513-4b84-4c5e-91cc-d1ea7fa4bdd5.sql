CREATE TABLE public.amateur_stories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  kicker text,
  headline text NOT NULL,
  standfirst text,
  body_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_text text,
  image_url text,
  image_credit text,
  categories text[] NOT NULL DEFAULT '{}',
  tournament_name text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT amateur_stories_categories_known CHECK (
    categories <@ ARRAY['mens','womens','boys','girls','seniors','midam','county','university','international']::text[]
  )
);

COMMENT ON COLUMN public.amateur_stories.categories IS 'Amateur beat categories. Multiple per story on purpose: a girls county final is both.';
COMMENT ON COLUMN public.amateur_stories.tournament_name IS 'Free text display string. Amateur events have no lookup table.';

CREATE INDEX amateur_stories_published_idx ON public.amateur_stories (published_at DESC NULLS LAST);
CREATE INDEX amateur_stories_categories_idx ON public.amateur_stories USING gin (categories);

GRANT SELECT ON public.amateur_stories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.amateur_stories TO authenticated;
GRANT ALL ON public.amateur_stories TO service_role;

ALTER TABLE public.amateur_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published amateur stories are readable by anyone"
  ON public.amateur_stories FOR SELECT TO anon, authenticated
  USING (published_at IS NOT NULL AND published_at <= now());

CREATE POLICY "Panel admins read all amateur stories"
  ON public.amateur_stories FOR SELECT TO authenticated
  USING (public.is_panel_admin());

CREATE POLICY "Panel admins write amateur stories"
  ON public.amateur_stories FOR INSERT TO authenticated
  WITH CHECK (public.is_panel_admin());

CREATE POLICY "Panel admins edit amateur stories"
  ON public.amateur_stories FOR UPDATE TO authenticated
  USING (public.is_panel_admin()) WITH CHECK (public.is_panel_admin());

CREATE POLICY "Panel admins delete amateur stories"
  ON public.amateur_stories FOR DELETE TO authenticated
  USING (public.is_panel_admin());

-- Validate on write, like the tour wire. Amateur golf has NO player or
-- tournament database, so tour-only block types are not checked against
-- anything here: an unknown type passes and the client renders nothing for it.
CREATE OR REPLACE FUNCTION public.validate_amateur_story_blocks()
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
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_amateur_story_blocks() FROM anon, authenticated;

CREATE TRIGGER amateur_stories_validate_blocks
  BEFORE INSERT OR UPDATE OF body_blocks ON public.amateur_stories
  FOR EACH ROW EXECUTE FUNCTION public.validate_amateur_story_blocks();

CREATE TRIGGER amateur_stories_set_updated_at
  BEFORE UPDATE ON public.amateur_stories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();