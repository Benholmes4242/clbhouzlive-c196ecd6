-- PHASE 1: Unified actor-aware follows table with dual-write to legacy tables.

CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_actor_type  text NOT NULL CHECK (follower_actor_type IN ('personal','business')),
  follower_actor_id    uuid NOT NULL,
  following_actor_type text NOT NULL CHECK (following_actor_type IN ('personal','business')),
  following_actor_id   uuid NOT NULL,
  follower_user_id     uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT follows_unique_edge UNIQUE (follower_actor_type, follower_actor_id, following_actor_type, following_actor_id),
  CONSTRAINT follows_no_self CHECK (NOT (follower_actor_type = following_actor_type AND follower_actor_id = following_actor_id))
);

CREATE INDEX IF NOT EXISTS idx_follows_follower  ON public.follows(follower_actor_type, follower_actor_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_actor_type, following_actor_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_user ON public.follows(follower_user_id);

GRANT SELECT ON public.follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Public read: follows are public.
CREATE POLICY "follows_select_public" ON public.follows
  FOR SELECT USING (true);

-- INSERT: caller must be the follower actor (self for personal, or a manager for business).
CREATE POLICY "follows_insert_as_valid_actor" ON public.follows
  FOR INSERT TO authenticated
  WITH CHECK (
    follower_user_id = auth.uid()
    AND (
      (follower_actor_type = 'personal' AND follower_actor_id = auth.uid())
      OR (
        follower_actor_type = 'business'
        AND follower_actor_id IN (SELECT public.get_user_business_ids(auth.uid()))
      )
    )
  );

-- DELETE: any manager of the follower actor can unfollow (shared business model).
CREATE POLICY "follows_delete_as_valid_actor" ON public.follows
  FOR DELETE TO authenticated
  USING (
    (follower_actor_type = 'personal' AND follower_actor_id = auth.uid())
    OR (
      follower_actor_type = 'business'
      AND follower_actor_id IN (SELECT public.get_user_business_ids(auth.uid()))
    )
  );

-- BACKFILL legacy rows into unified table (idempotent via ON CONFLICT).
INSERT INTO public.follows (
  follower_actor_type, follower_actor_id,
  following_actor_type, following_actor_id,
  follower_user_id, created_at
)
SELECT 'personal', uf.follower_id, 'personal', uf.following_id, uf.follower_id, COALESCE(uf.created_at, now())
FROM public.user_follows uf
WHERE uf.follower_id <> uf.following_id
ON CONFLICT ON CONSTRAINT follows_unique_edge DO NOTHING;

INSERT INTO public.follows (
  follower_actor_type, follower_actor_id,
  following_actor_type, following_actor_id,
  follower_user_id, created_at
)
SELECT 'personal', bf.follower_id, 'business', bf.business_id, bf.follower_id, COALESCE(bf.created_at, now())
FROM public.business_follows bf
ON CONFLICT ON CONSTRAINT follows_unique_edge DO NOTHING;

-- DUAL-WRITE: mirror new follows → legacy tables so existing readers keep working.
CREATE OR REPLACE FUNCTION public.mirror_follows_to_legacy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.follower_actor_type = 'personal' AND NEW.following_actor_type = 'personal' THEN
      INSERT INTO public.user_follows (follower_id, following_id, created_at)
      VALUES (NEW.follower_actor_id, NEW.following_actor_id, NEW.created_at)
      ON CONFLICT DO NOTHING;
    ELSIF NEW.follower_actor_type = 'personal' AND NEW.following_actor_type = 'business' THEN
      INSERT INTO public.business_follows (follower_id, follower_actor_id, follower_actor_type, business_id, created_at)
      VALUES (NEW.follower_actor_id, NEW.follower_actor_id, 'personal', NEW.following_actor_id, NEW.created_at)
      ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    IF OLD.follower_actor_type = 'personal' AND OLD.following_actor_type = 'personal' THEN
      DELETE FROM public.user_follows
       WHERE follower_id = OLD.follower_actor_id AND following_id = OLD.following_actor_id;
    ELSIF OLD.follower_actor_type = 'personal' AND OLD.following_actor_type = 'business' THEN
      DELETE FROM public.business_follows
       WHERE follower_id = OLD.follower_actor_id AND business_id = OLD.following_actor_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_mirror_follows_to_legacy_ins ON public.follows;
CREATE TRIGGER trg_mirror_follows_to_legacy_ins
AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.mirror_follows_to_legacy();

DROP TRIGGER IF EXISTS trg_mirror_follows_to_legacy_del ON public.follows;
CREATE TRIGGER trg_mirror_follows_to_legacy_del
AFTER DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.mirror_follows_to_legacy();

-- REVERSE MIRROR: legacy → follows, for any code path still writing the old tables directly.
CREATE OR REPLACE FUNCTION public.mirror_user_follows_to_follows()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.follower_id <> NEW.following_id THEN
      INSERT INTO public.follows (
        follower_actor_type, follower_actor_id,
        following_actor_type, following_actor_id,
        follower_user_id, created_at
      ) VALUES (
        'personal', NEW.follower_id,
        'personal', NEW.following_id,
        NEW.follower_id, COALESCE(NEW.created_at, now())
      )
      ON CONFLICT ON CONSTRAINT follows_unique_edge DO NOTHING;
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    DELETE FROM public.follows
     WHERE follower_actor_type = 'personal' AND follower_actor_id = OLD.follower_id
       AND following_actor_type = 'personal' AND following_actor_id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_mirror_user_follows_ins ON public.user_follows;
CREATE TRIGGER trg_mirror_user_follows_ins
AFTER INSERT ON public.user_follows
FOR EACH ROW EXECUTE FUNCTION public.mirror_user_follows_to_follows();

DROP TRIGGER IF EXISTS trg_mirror_user_follows_del ON public.user_follows;
CREATE TRIGGER trg_mirror_user_follows_del
AFTER DELETE ON public.user_follows
FOR EACH ROW EXECUTE FUNCTION public.mirror_user_follows_to_follows();

CREATE OR REPLACE FUNCTION public.mirror_business_follows_to_follows()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.follows (
      follower_actor_type, follower_actor_id,
      following_actor_type, following_actor_id,
      follower_user_id, created_at
    ) VALUES (
      COALESCE(NEW.follower_actor_type, 'personal'),
      COALESCE(NEW.follower_actor_id, NEW.follower_id),
      'business', NEW.business_id,
      NEW.follower_id, COALESCE(NEW.created_at, now())
    )
    ON CONFLICT ON CONSTRAINT follows_unique_edge DO NOTHING;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    DELETE FROM public.follows
     WHERE follower_actor_type = COALESCE(OLD.follower_actor_type, 'personal')
       AND follower_actor_id = COALESCE(OLD.follower_actor_id, OLD.follower_id)
       AND following_actor_type = 'business'
       AND following_actor_id = OLD.business_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_mirror_business_follows_ins ON public.business_follows;
CREATE TRIGGER trg_mirror_business_follows_ins
AFTER INSERT ON public.business_follows
FOR EACH ROW EXECUTE FUNCTION public.mirror_business_follows_to_follows();

DROP TRIGGER IF EXISTS trg_mirror_business_follows_del ON public.business_follows;
CREATE TRIGGER trg_mirror_business_follows_del
AFTER DELETE ON public.business_follows
FOR EACH ROW EXECUTE FUNCTION public.mirror_business_follows_to_follows();