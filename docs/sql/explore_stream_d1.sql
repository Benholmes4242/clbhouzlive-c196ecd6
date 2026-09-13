-- ============================================================================
-- BRIEF_EXPLORE_MAGAZINE - PHASE D1 DRAFT. BEN RUNS THIS. NOT A MIGRATION.
-- ============================================================================
-- Ranked, cadenced, keyset-paginated ALL view for /amateur.
--
-- STANDING IS NOT RE-DERIVED. Every n / of figure comes from the DEPLOYED
-- public.get_viewer_standing(p_viewer) - the same function the "Where you
-- stand" shelf reads - so a card and the shelf on the same page cannot
-- disagree. This file contains NO rank() over a board and NO count(distinct
-- user_id) field size. board_pool / board_qualifies stay untouched.
--
-- ARRIVAL IS HONEST. gam_round_stats.created_at is ingest time, measured on
-- production before this draft was written: 2021 play-dated rounds (278 rows,
-- 17 members) arrived on 7 distinct dates with a play->arrival lag of
-- 1674..2028 days, i.e. clustered at their sync date and NOT spread across
-- 2021. 2026 rounds show min lag 0. D2 may key the backlog lane on this
-- column. D1 uses it for freshness only.
--
-- SECURITY INVOKER on purpose: candidate depth is bounded by the caller's own
-- RLS visibility. Nothing here bypasses RLS or elevates to definer.
--
-- SCOPE OF D1: the ALL pool as accepted on device - rounds, written reviews,
-- published stories. Long-form video stays client-composed and is merged by
-- the adapter using these same weights until D3 moves Watch to the RPC.
-- Every other view returns a deliberate "unsupported" empty set in D1.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. explore_config - the weights, readable, never hardcoded twice.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.explore_config (
  key        text PRIMARY KEY,
  value      numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.explore_config TO anon;
GRANT SELECT ON public.explore_config TO authenticated;
GRANT ALL    ON public.explore_config TO service_role;

ALTER TABLE public.explore_config ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'explore_config'
      AND policyname = 'explore_config is world readable'
  ) THEN
    CREATE POLICY "explore_config is world readable"
      ON public.explore_config FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.explore_config_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS explore_config_touch ON public.explore_config;
CREATE TRIGGER explore_config_touch BEFORE UPDATE ON public.explore_config
  FOR EACH ROW EXECUTE FUNCTION public.explore_config_touch();

-- The client's shipped constants, byte-for-byte. Seeded, not overwritten.
INSERT INTO public.explore_config (key, value) VALUES
  ('w_consequence',     6),
  ('w_ring',            3),
  ('w_fresh',           4),
  ('w_notable',         1),
  ('half_life_h',      96),
  ('story_damp',      0.6),
  ('seen_damp',       0.5),
  ('outer_ring_gap',    3),   -- at most one outer-ring card per four
  ('page_size',        12)
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. get_explore_stream
-- ---------------------------------------------------------------------------
-- The five brief arguments are preserved in order and keep their defaults. The
-- three trailing geography arguments are ADDITIVE and nullable: the resolved
-- club id / county / country come from the shared client resolver
-- (useViewerScoreScope). Geography is never re-resolved here and home-club free
-- text is never read.
--
-- Cursor shape (opaque to the client):
--   { "s": <numeric score>, "i": "<candidate id>",
--     "tail": { "key": "<kind:ring>", "since_outer": <int> } }
-- s/i are the RAW RANKED boundary, never the last card displayed: cadence
-- defers cards, and paginating from a displayed card would skip the deferred
-- ones. tail carries the cadence/ring spacing state so cadence does not reset
-- at a page seam.

DROP FUNCTION IF EXISTS public.get_explore_stream(uuid, text, text, jsonb, integer, uuid, text, text);

CREATE OR REPLACE FUNCTION public.get_explore_stream(
  p_viewer  uuid,
  p_view    text    DEFAULT 'all',
  p_scope   text    DEFAULT 'world',
  p_cursor  jsonb   DEFAULT NULL,
  p_limit   integer DEFAULT NULL,
  p_club_id uuid    DEFAULT NULL,
  p_county  text    DEFAULT NULL,
  p_country text    DEFAULT NULL
)
RETURNS TABLE (
  id          text,
  kind        text,
  ring        text,
  lane        text,
  score       numeric,
  consequence jsonb,
  subject     jsonb,
  who         jsonb,
  facts       jsonb,
  seen        boolean,
  next_cursor jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  c_w_cons   numeric; c_w_ring numeric; c_w_fresh numeric; c_w_not numeric;
  c_half     numeric; c_story  numeric; c_seen    numeric;
  c_gap      integer; v_limit  integer;
  v_cur_s    numeric; v_cur_i text;
  v_prev_key text;    v_since_outer integer;
  v_row      record;
  v_taken    integer := 0;
  v_last_s   numeric; v_last_i text;
  v_deferred jsonb := '[]'::jsonb;   -- outer-ring cards awaiting a slot
  v_out      jsonb := '[]'::jsonb;
BEGIN
  SELECT
    coalesce(max(value) FILTER (WHERE key = 'w_consequence'),  6),
    coalesce(max(value) FILTER (WHERE key = 'w_ring'),         3),
    coalesce(max(value) FILTER (WHERE key = 'w_fresh'),        4),
    coalesce(max(value) FILTER (WHERE key = 'w_notable'),      1),
    coalesce(max(value) FILTER (WHERE key = 'half_life_h'),   96),
    coalesce(max(value) FILTER (WHERE key = 'story_damp'),   0.6),
    coalesce(max(value) FILTER (WHERE key = 'seen_damp'),    0.5),
    coalesce(max(value) FILTER (WHERE key = 'outer_ring_gap'), 3)::int,
    coalesce(p_limit, max(value) FILTER (WHERE key = 'page_size'), 12)::int
  INTO c_w_cons, c_w_ring, c_w_fresh, c_w_not, c_half, c_story, c_seen, c_gap, v_limit
  FROM public.explore_config;

  -- Views other than All are DELIBERATELY unsupported in D1 (D3 opens them).
  IF p_view IS DISTINCT FROM 'all' THEN
    RETURN;
  END IF;

  v_cur_s       := nullif(p_cursor -> 's', 'null')::text::numeric;
  v_cur_i       := p_cursor ->> 'i';
  v_prev_key    := p_cursor #>> '{tail,key}';
  v_since_outer := coalesce((p_cursor #>> '{tail,since_outer}')::int, 2147483647);

  FOR v_row IN
    WITH stamp AS (
      SELECT s.last_seen_at FROM public.user_surface_last_seen s
      WHERE s.user_id = p_viewer AND s.surface_key = 'discover'
    ),
    standing AS (
      SELECT * FROM public.get_viewer_standing(p_viewer)
    ),
    bests AS (
      SELECT g.course_id, min(g.gross_score) AS best
      FROM public.gam_round_stats g
      WHERE g.user_id = p_viewer AND g.holes_played = 18 AND g.course_id IS NOT NULL
      GROUP BY g.course_id
    ),
    shortlist AS (
      SELECT DISTINCT s.course_id FROM public.course_shortlists s WHERE s.user_id = p_viewer
    ),
    my_ratings AS (
      SELECT r.course_id, max(r.rating) AS rating
      FROM public.course_ratings r WHERE r.user_id = p_viewer GROUP BY r.course_id
    ),
    circle AS (
      SELECT f.following_actor_id AS uid FROM public.follows f
      WHERE f.follower_actor_id = p_viewer
        AND f.follower_actor_type = 'personal' AND f.following_actor_type = 'personal'
      UNION SELECT p_viewer
    ),
    -- The record book, READ. Ambiguity (two current rank-1 rows for a course)
    -- is rejected rather than resolved, exactly as the client does.
    legends AS (
      SELECT l.course_id, l.user_id, l.value, l.attained_at::date AS attained_on
      FROM public.gam_course_legends l
      WHERE l.is_current AND l.category = 'lowest_gross_all_time' AND l.rank = 1
    ),
    holders AS (
      SELECT course_id, min(user_id::text)::uuid AS user_id, min(value) AS value,
             min(attained_on) AS attained_on
      FROM legends GROUP BY course_id HAVING count(*) = 1
    ),
    lost AS (
      SELECT DISTINCT (n.data ->> 'course_id') AS course_id, (n.data ->> 'taken_by') AS taken_by
      FROM public.notifications n
      WHERE n.user_id = p_viewer AND n.type = 'legend_lost'
    ),
    -- ROUNDS -----------------------------------------------------------------
    rounds AS (
      SELECT
        'round:' || g.id::text                        AS cid,
        'round'::text                                 AS kind,
        g.created_at                                  AS arrived_at,
        g.play_date::text                             AS play_date,
        g.course_id, c.name AS course_name, c.region, c.sub_country,
        c.thumbnail_image, c.club_id,
        g.user_id, up.display_name, up.profile_photo_url,
        (g.user_id = p_viewer)                        AS is_self,
        (g.user_id IN (SELECT uid FROM circle))       AS is_circle,
        g.gross_score, g.course_par, n.net_score, g.stableford_points,
        g.whs_score_id, g.birdies, g.eagles, g.albatrosses, g.holes_in_one,
        g.clean_card, g.hcp_at_time,
        (h.user_id = g.user_id AND h.value = g.gross_score
           AND h.attained_on = g.play_date)           AS is_record_round,
        (lo.taken_by IS NOT NULL)                     AS record_lost_to_them,
        st.rank_now, st.field_now, st.rank_then, st.delta,
        b.best                                        AS my_best,
        (sl.course_id IS NOT NULL)                    AS on_list,
        NULL::numeric AS rating, NULL::integer AS rating_n,
        NULL::text AS headline, NULL::text AS story_slug, NULL::text AS source,
        NULL::text AS review_id, NULL::text AS first_sentence
      FROM public.gam_round_stats g
      JOIN public.golf_courses c  ON c.id = g.course_id
      JOIN public.user_profiles up ON up.id = g.user_id
      LEFT JOIN public.gam_round_net n ON n.whs_score_id = g.whs_score_id
      LEFT JOIN holders h   ON h.course_id = g.course_id
      LEFT JOIN standing st ON st.course_id = g.course_id
      LEFT JOIN bests b     ON b.course_id = g.course_id
      LEFT JOIN shortlist sl ON sl.course_id = g.course_id
      LEFT JOIN lost lo ON lo.course_id = g.course_id::text AND lo.taken_by = g.user_id::text
      WHERE g.holes_played = 18 AND g.course_id IS NOT NULL AND g.whs_score_id IS NOT NULL
    ),
    -- REVIEWS ----------------------------------------------------------------
    reviews AS (
      SELECT
        'review:' || r.id::text AS cid, 'review'::text AS kind,
        r.created_at AS arrived_at, r.created_at::date::text AS play_date,
        r.course_id, c.name, c.region, c.sub_country, c.thumbnail_image, c.club_id,
        r.user_id, up.display_name, up.profile_photo_url,
        (r.user_id = p_viewer), (r.user_id IN (SELECT uid FROM circle)),
        NULL::integer, NULL::integer, NULL::integer, NULL::integer,
        NULL::uuid, NULL::integer, NULL::integer, NULL::integer, NULL::integer,
        NULL::boolean, NULL::numeric,
        false, false,
        NULL::integer, NULL::integer, NULL::integer, NULL::integer,
        NULL::integer,
        (sl.course_id IS NOT NULL),
        r.rating, mr.rating::integer,
        NULL::text, NULL::text, NULL::text,
        r.id::text,
        left(btrim(coalesce(r.review, '')), 240),
        NULL::text
      FROM public.course_ratings r
      JOIN public.golf_courses c   ON c.id = r.course_id
      JOIN public.user_profiles up ON up.id = r.user_id
      LEFT JOIN shortlist sl ON sl.course_id = r.course_id
      LEFT JOIN my_ratings mr ON mr.course_id = r.course_id
      WHERE coalesce(r.is_mock, false) = false
        AND btrim(coalesce(r.review, '')) <> ''
    ),
    -- STORIES ----------------------------------------------------------------
    stories AS (
      SELECT
        'story:' || s.id::text, 'story'::text,
        s.published_at, s.published_at::date::text,
        NULL::uuid, NULL::text, NULL::text, NULL::text, s.image_url, NULL::uuid,
        NULL::uuid, NULL::text, NULL::text,
        false, false,
        NULL::integer, NULL::integer, NULL::integer, NULL::integer,
        NULL::uuid, NULL::integer, NULL::integer, NULL::integer, NULL::integer,
        NULL::boolean, NULL::numeric,
        false, false,
        NULL::integer, NULL::integer, NULL::integer, NULL::integer,
        NULL::integer, false,
        NULL::numeric, NULL::integer,
        s.headline, s.slug, s.kicker,
        NULL::text, NULL::text
      FROM public.amateur_stories s
      WHERE s.published_at IS NOT NULL AND s.published_at <= now()
    ),
    pool AS (
      SELECT * FROM rounds UNION ALL SELECT * FROM reviews UNION ALL SELECT * FROM stories
    ),
    shaped AS (
      SELECT p.*,
        -- THE RING LADDER, nearest wins. No course geography = no ring.
        CASE
          WHEN p.kind = 'story' THEN NULL
          WHEN p.is_self THEN 'own'
          WHEN p_club_id IS NOT NULL AND p.club_id = p_club_id THEN 'club'
          WHEN p_county  IS NOT NULL AND p.region = p_county THEN 'county'
          WHEN p_country IS NOT NULL AND p.sub_country = p_country THEN 'country'
          WHEN p.course_id IS NOT NULL THEN 'world'
          ELSE NULL
        END AS ring_k,
        CASE WHEN p.gross_score IS NOT NULL AND p.course_par IS NOT NULL
             THEN p.gross_score - p.course_par END AS to_par,
        (SELECT last_seen_at FROM stamp) AS seen_at
      FROM pool p
    ),
    typed AS (
      SELECT s.*,
        CASE
          WHEN s.kind = 'round' AND s.is_record_round AND NOT s.is_self AND s.record_lost_to_them THEN 'record_lost'
          WHEN s.kind = 'round' AND s.is_record_round THEN 'record_taken'
          WHEN s.kind = 'round' AND NOT s.is_self AND s.rank_now IS NOT NULL
               AND s.gross_score IS NOT NULL AND s.my_best IS NOT NULL
               AND s.gross_score < s.my_best THEN 'rank_down'
          WHEN s.kind = 'round' AND NOT s.is_self AND s.on_list THEN 'list_first'
          WHEN s.kind = 'round' AND NOT s.is_self AND s.rank_now IS NOT NULL THEN 'played_nochange'
          WHEN s.kind = 'round' AND NOT s.is_self AND s.is_circle THEN 'circle_round'
          WHEN s.kind = 'round' AND NOT s.is_self AND (
                 coalesce(s.holes_in_one,0) > 0 OR coalesce(s.albatrosses,0) > 0
                 OR s.is_record_round OR coalesce(s.stableford_points,0) >= 45
                 OR (s.to_par IS NOT NULL AND s.to_par < 0)
                 OR coalesce(s.clean_card,false) OR coalesce(s.birdies,0) >= 5
               ) THEN 'platform_notable'
          WHEN s.kind = 'round' AND s.is_self AND s.delta IS NOT NULL AND s.delta > 0 THEN 'rank_up'
          WHEN s.kind = 'round' AND s.is_self AND s.rank_then IS NOT NULL AND s.delta = 0 THEN 'rank_hold'
          WHEN s.kind = 'round' AND s.is_self THEN 'played_nochange'
          WHEN s.kind = 'review' AND s.rating_n IS NOT NULL THEN 'review_disagree'
          WHEN s.kind = 'review' AND s.on_list THEN 'review_on_list'
          WHEN s.kind = 'review' AND s.rating >= 9 THEN 'platform_notable'
          ELSE NULL
        END AS cons_kind
      FROM shaped s
    ),
    gated AS (
      -- NO CONSEQUENCE, NO CARD - unless it is an outer ring with something to
      -- open. Reviews and stories are admitted regardless, as shipped.
      SELECT * FROM typed t
      WHERE t.kind <> 'round'
         OR t.cons_kind IS NOT NULL
         OR (t.ring_k IN ('county','country','world') AND t.course_id IS NOT NULL
             AND t.whs_score_id IS NOT NULL)
    ),
    scored AS (
      SELECT g.*,
        (g.seen_at IS NOT NULL AND g.arrived_at IS NOT NULL AND g.arrived_at < g.seen_at) AS is_seen,
        -- The consequence ORDER *is* the weighting: 1.0 for the heaviest kind,
        -- descending in equal steps, never 0. Identical to consequenceWeight().
        coalesce(w.rank::numeric / 14, 0) AS cons_w,
        CASE g.ring_k WHEN 'own' THEN 1 WHEN 'club' THEN 0.8 WHEN 'county' THEN 0.55
             WHEN 'country' THEN 0.35 WHEN 'world' THEN 0.2 ELSE 0 END AS ring_w,
        CASE
          WHEN coalesce(g.holes_in_one,0) > 0 THEN 5
          WHEN coalesce(g.albatrosses,0) > 0 THEN 4.5
          WHEN g.is_record_round THEN 4
          WHEN coalesce(g.stableford_points,0) >= 45 THEN 3.5
          WHEN g.to_par IS NOT NULL AND g.to_par < 0 THEN 3
          WHEN coalesce(g.clean_card,false) THEN 2.5
          WHEN coalesce(g.birdies,0) >= 5 THEN 2
          WHEN g.kind = 'review' AND g.rating >= 9 THEN 2
          ELSE 0
        END AS notable
      FROM gated g
      LEFT JOIN (VALUES
        ('record_taken',14),('record_lost',13),('rank_down',12),('rank_up',11),
        ('rank_hold',10),('list_new_low',9),('list_first',8),('review_disagree',7),
        ('review_on_list',6),('review_played',5),('circle_round',4),
        ('played_nochange',3),('backlog_own_best',2),('platform_notable',1)
      ) AS w(kind, rank) ON w.kind = g.cons_kind
    ),
    ranked AS (
      SELECT s.*,
        (
          (c_w_cons * s.cons_w * CASE WHEN s.is_seen THEN c_seen ELSE 1 END)
          + (c_w_ring * s.ring_w * CASE WHEN s.is_seen THEN c_seen ELSE 1 END)
          + (c_w_fresh * power(0.5, greatest(0, extract(epoch FROM (now() - coalesce(s.arrived_at, now()))) / 3600.0) / c_half))
          + (c_w_not * s.notable)
        ) * CASE WHEN s.kind = 'story' THEN c_story ELSE 1 END AS sc
      FROM scored s
    )
    SELECT q.*
    FROM ranked q
    WHERE v_cur_s IS NULL
       OR q.sc < v_cur_s
       OR (q.sc = v_cur_s AND q.cid > v_cur_i)
    ORDER BY q.sc DESC, q.cid ASC
    LIMIT v_limit * 6

  LOOP
    -- THE CADENCE PASS, POSITIONAL, exactly as the client ships it.
    -- 1. an outer-ring card cannot sit within c_gap of the previous one: it is
    --    DEFERRED, never dropped.
    -- 2. two cards with the same kind:ring key cannot sit adjacent: the second
    --    is deferred one slot.
    -- 3. a story never leads a page.
    v_last_s := v_row.sc; v_last_i := v_row.cid;

    IF v_row.ring_k IN ('county','country','world') AND v_since_outer < c_gap THEN
      v_deferred := v_deferred || jsonb_build_array(to_jsonb(v_row));
      CONTINUE;
    END IF;

    IF v_prev_key = (coalesce(v_row.kind,'none') || ':' || coalesce(v_row.ring_k,'none'))
       OR (v_taken = 0 AND v_prev_key IS NULL AND v_row.kind = 'story') THEN
      v_deferred := v_deferred || jsonb_build_array(to_jsonb(v_row));
      CONTINUE;
    END IF;

    v_out := v_out || jsonb_build_array(to_jsonb(v_row));
    v_prev_key := coalesce(v_row.kind,'none') || ':' || coalesce(v_row.ring_k,'none');
    v_since_outer := CASE WHEN v_row.ring_k IN ('county','country','world') THEN 0
                          ELSE v_since_outer + 1 END;
    v_taken := v_taken + 1;

    -- A deferred card takes the next slot it legally can.
    IF jsonb_array_length(v_deferred) > 0 AND v_taken < v_limit THEN
      DECLARE d jsonb := v_deferred -> 0;
      BEGIN
        IF NOT (d ->> 'ring_k' IN ('county','country','world') AND v_since_outer < c_gap)
           AND v_prev_key IS DISTINCT FROM (coalesce(d ->> 'kind','none') || ':' || coalesce(d ->> 'ring_k','none')) THEN
          v_out := v_out || jsonb_build_array(d);
          v_deferred := v_deferred - 0;
          v_prev_key := coalesce(d ->> 'kind','none') || ':' || coalesce(d ->> 'ring_k','none');
          v_since_outer := CASE WHEN (d ->> 'ring_k') IN ('county','country','world') THEN 0
                                ELSE v_since_outer + 1 END;
          v_taken := v_taken + 1;
        END IF;
      END;
    END IF;

    EXIT WHEN v_taken >= v_limit;
  END LOOP;

  RETURN QUERY
  SELECT
    r ->> 'cid',
    r ->> 'kind',
    r ->> 'ring_k',
    'news'::text,                                    -- D2 adds the backlog lane
    (r ->> 'sc')::numeric,
    CASE WHEN r ->> 'cons_kind' IS NULL THEN NULL ELSE jsonb_strip_nulls(jsonb_build_object(
      'kind', r ->> 'cons_kind',
      'n', CASE WHEN r ->> 'cons_kind' IN ('record_taken','record_lost') THEN r -> 'gross_score'
                ELSE r -> 'rank_now' END,
      'of', r -> 'field_now',
      'delta', CASE
                 WHEN r ->> 'cons_kind' = 'record_lost'
                   AND (r -> 'my_best') IS NOT NULL AND (r -> 'gross_score') IS NOT NULL
                   AND (r ->> 'my_best')::numeric > (r ->> 'gross_score')::numeric
                   THEN to_jsonb((r ->> 'my_best')::numeric - (r ->> 'gross_score')::numeric)
                 WHEN r ->> 'cons_kind' IN ('rank_up','rank_down')
                   AND (r -> 'delta') IS NOT NULL AND (r ->> 'delta')::int <> 0
                   THEN to_jsonb(abs((r ->> 'delta')::int))
               END,
      'theirs', CASE WHEN r ->> 'kind' = 'review' THEN r -> 'rating' END,
      'yours',  CASE WHEN r ->> 'cons_kind' = 'review_disagree' THEN r -> 'rating_n' END,
      'held_by_viewer', CASE WHEN r ->> 'cons_kind' = 'record_taken' THEN r -> 'is_self' END
    )) END,
    CASE WHEN (r -> 'course_id') IS NULL AND (r -> 'thumbnail_image') IS NULL THEN NULL
         ELSE jsonb_build_object(
           'course_id', r -> 'course_id', 'course_name', r -> 'course_name',
           'region', r -> 'region', 'sub_country', r -> 'sub_country',
           'image_url', r -> 'thumbnail_image', 'pending', false) END,
    CASE WHEN (r -> 'user_id') IS NULL THEN NULL
         ELSE jsonb_build_object(
           'user_id', r -> 'user_id', 'display_name', r -> 'display_name',
           'photo_url', r -> 'profile_photo_url', 'is_viewer', r -> 'is_self') END,
    jsonb_strip_nulls(jsonb_build_object(
      'gross', r -> 'gross_score', 'course_par', r -> 'course_par',
      'to_par', r -> 'to_par', 'net', r -> 'net_score',
      'stableford', r -> 'stableford_points', 'score_id', r -> 'whs_score_id',
      'play_date', r -> 'play_date', 'arrived_at', r -> 'arrived_at',
      'rating', r -> 'rating', 'review_id', r -> 'review_id',
      'first_sentence', r -> 'first_sentence',
      'headline', r -> 'headline', 'story_slug', r -> 'story_slug',
      'source', r -> 'source', 'published_at', r -> 'arrived_at',
      'birdies', r -> 'birdies', 'eagles', r -> 'eagles',
      'albatrosses', r -> 'albatrosses', 'holes_in_one', r -> 'holes_in_one',
      'clean_card', r -> 'clean_card', 'is_course_record', r -> 'is_record_round',
      'hcp_at_time', r -> 'hcp_at_time')),
    (r ->> 'is_seen')::boolean,
    -- The cursor is the RAW ranked boundary plus the cadence tail, identical on
    -- every row of the page. NULL once the pool is exhausted.
    CASE WHEN v_taken < v_limit AND jsonb_array_length(v_deferred) = 0 THEN NULL
         ELSE jsonb_build_object('s', v_last_s, 'i', v_last_i,
                'tail', jsonb_build_object('key', v_prev_key, 'since_outer', v_since_outer)) END
  FROM jsonb_array_elements(v_out) AS r;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_explore_stream(uuid, text, text, jsonb, integer, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_explore_stream(uuid, text, text, jsonb, integer, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_explore_stream(uuid, text, text, jsonb, integer, uuid, text, text) TO service_role;
