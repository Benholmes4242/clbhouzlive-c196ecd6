-- 1) New visibility-level columns on user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS handicap_visibility   text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS leaderboard_visibility text NOT NULL DEFAULT 'public';

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS chk_handicap_visibility;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT chk_handicap_visibility
    CHECK (handicap_visibility IN ('public','friends','private'));

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS chk_leaderboard_visibility;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT chk_leaderboard_visibility
    CHECK (leaderboard_visibility IN ('public','friends','private'));

-- 2) Backfill old flags -> new levels (preserves existing user choices)
UPDATE public.user_profiles SET handicap_visibility =
  CASE
    WHEN COALESCE(handicap_page_visibility,'everyone') = 'nobody' THEN 'private'
    WHEN COALESCE(show_handicap, true) = false                    THEN 'private'
    WHEN handicap_page_visibility = 'friends'                     THEN 'friends'
    ELSE 'public'
  END;

UPDATE public.user_profiles SET leaderboard_visibility =
  CASE
    WHEN COALESCE(show_in_handicap_leaderboards, true) = false THEN 'private'
    ELSE 'public'
  END;

-- 3) Swap helper internals — signatures unchanged, surfaces untouched
CREATE OR REPLACE FUNCTION public.can_view_handicap(_viewer uuid, _target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN _viewer IS NOT NULL AND _viewer = _target THEN true
    ELSE EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = _target
        AND COALESCE(p.is_public, true) = true
        AND p.deleted_at IS NULL
        AND COALESCE(p.is_suspended, false) = false
        AND (
          p.handicap_visibility = 'public'
          OR (p.handicap_visibility = 'friends' AND public.are_friends(_viewer, _target))
        )
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.can_appear_in_leaderboard(
  _viewer uuid, _target uuid, _scope text DEFAULT 'global')
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN _viewer IS NOT NULL AND _viewer = _target THEN true
    ELSE EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = _target
        AND COALESCE(p.is_public, true) = true
        AND p.deleted_at IS NULL
        AND COALESCE(p.is_suspended, false) = false
        AND (
          p.leaderboard_visibility = 'public'
          OR (p.leaderboard_visibility = 'friends'
              AND (public.are_friends(_viewer, _target) OR _scope = 'friends'))
        )
    )
  END;
$$;