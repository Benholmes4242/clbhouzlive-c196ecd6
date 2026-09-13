-- ============================================================================
-- BRIEF_EXPLORE_MAGAZINE - PHASE D2 DRAFT. BEN RUNS THIS. NOT A MIGRATION.
-- ============================================================================
-- THE BACKLOG LANE. Built on the DEPLOYED get_explore_stream, dumped verbatim
-- with pg_get_functiondef before this file was written (the D1 file in this
-- folder is no longer authoritative; the live body and the D1 draft body were
-- byte-identical at the time of dumping, and every D1 rule below is carried
-- forward unchanged).
--
-- ARRIVAL IS HONEST - MEASURED, NOT ASSUMED. 2021 play-dated rounds (278 rows,
-- 17 members) arrived on 7 distinct dates with a play->arrival lag of
-- 1674..2028 days, i.e. clustered at their sync date. 2026 rounds show a
-- minimum lag of 0. gam_round_stats.created_at is therefore ingest time and the
-- lane may key on it.
--
-- WHAT CHANGES, AND ONLY THIS:
--   1. lane_k is computed. A ROUND whose play_date is more than 30 days before
--      its arrival is 'backlog'. Reviews and stories are ALWAYS news: their
--      created_at / published_at IS their event, so there is nothing to split.
--   2. Backlog freshness is ZERO. A round synced today that was played in 2019
--      must not out-rank this morning's card because of when it arrived.
--   3. Backlog NEVER LEADS a page. Position 0 is always news.
--   4. Backlog is admitted only through the allowance: at most one backlog card
--      per backlog_ratio placed slots (default 3 = one in three), and only once
--      the news window could not fill the page on its own. Because the
--      candidate iteration puts every news candidate before every backlog
--      candidate, "news first" needs no extra count: a backlog row is only ever
--      reached when news ran out of placeable cards.
--   5. Backlog gets its OWN keyset boundary in the cursor (tail.bl), plus
--      tail.since_back for the pacing gap. A backlog row that the allowance,
--      the outer-ring gap or the adjacency rule turns away is left UNCONSUMED -
--      the boundary only advances past backlog rows actually placed - so no
--      backlog card can ever be skipped, and the backlog stays reachable at any
--      depth without the deferred-id list growing.
--
-- UNCHANGED FROM D1: standing is never re-derived (public.get_viewer_standing
-- is called, so a card's n / of equals the "Where you stand" shelf), ties are
-- rejected rather than resolved, the positional cadence, the outer-ring cap and
-- its documented relaxation, the story-never-leads rule, SECURITY INVOKER, the
-- eight arguments and their defaults, and the returned column list.
--
-- CONTRADICTION FILED (brief wins): with news exhausted for a viewer, a page
-- cannot open at all - backlog may not lead - so the stream ends rather than
-- serving an all-backlog page. Depth for such a viewer is bounded by their news
-- supply, by design.
-- ============================================================================

-- One new weight. Seeded, never overwritten.
INSERT INTO public.explore_config (key, value) VALUES
  ('backlog_ratio', 3)   -- at most one backlog card per three placed slots
ON CONFLICT (key) DO NOTHING;

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
  relaxed     boolean,
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
  c_gap      integer; v_limit  integer; c_back    integer;
  v_cur_s    numeric; v_cur_i text;
  v_prev_key text;    v_since_outer integer;
  v_row      record;
  v_taken    integer := 0;
  v_last_s   numeric; v_last_i text;
  v_bl_s     numeric; v_bl_i  text;      -- backlog keyset boundary, in and out
  v_since_back integer;                  -- placed slots since the last backlog
  v_back_left  integer := 0;             -- backlog rows the allowance turned away
  v_back_hold  jsonb := '[]'::jsonb;     -- backlog cadence could not place yet

  v_news_placed integer := 0;            -- news cards placed on THIS page

  v_deferred jsonb := '[]'::jsonb;       -- news cadence could not place yet
  v_carry    text[] := '{}';             -- deferred ids handed back by the cursor
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
    coalesce(p_limit, max(value) FILTER (WHERE key = 'page_size'), 12)::int,
    greatest(coalesce(max(value) FILTER (WHERE key = 'backlog_ratio'), 3)::int, 1)
  INTO c_w_cons, c_w_ring, c_w_fresh, c_w_not, c_half, c_story, c_seen, c_gap,
       v_limit, c_back
  FROM public.explore_config;

  -- Views other than All remain DELIBERATELY unsupported until D3.
  IF p_view IS DISTINCT FROM 'all' THEN
    RETURN;
  END IF;

  v_cur_s       := nullif(p_cursor -> 's', 'null')::text::numeric;
  v_cur_i       := p_cursor ->> 'i';
  v_prev_key    := p_cursor #>> '{tail,key}';
  v_since_outer := coalesce((p_cursor #>> '{tail,since_outer}')::int, 1000000);
  v_bl_s        := nullif(p_cursor #> '{tail,bl,s}', 'null')::text::numeric;
  v_bl_i        := p_cursor #>> '{tail,bl,i}';
  v_since_back  := coalesce((p_cursor #>> '{tail,since_back}')::int, 1000000);
  SELECT coalesce(array_agg(x), '{}') INTO v_carry
  FROM jsonb_array_elements_text(coalesce(p_cursor #> '{tail,deferred}', '[]'::jsonb)) x;

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
        left(btrim(coalesce(r.review, '')), 240)
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
        CASE
          WHEN p.kind = 'story' THEN NULL
          WHEN p.is_self THEN 'own'
          WHEN p_club_id IS NOT NULL AND p.club_id = p_club_id THEN 'club'
          WHEN p_county  IS NOT NULL AND p.region = p_county THEN 'county'
          WHEN p_country IS NOT NULL AND p.sub_country = p_country THEN 'country'
          WHEN p.course_id IS NOT NULL THEN 'world'
          ELSE NULL
        END AS ring_k,
        -- THE LANE. ROUNDS ONLY. Arrival more than 30 days after play is a
        -- backfill, not news. Reviews and stories are their own event.
        CASE
          WHEN p.kind = 'round' AND p.play_date IS NOT NULL AND p.arrived_at IS NOT NULL
               AND (p.arrived_at::date - p.play_date::date) > 30 THEN 'backlog'
          ELSE 'news'
        END AS lane_k,
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
      SELECT * FROM typed t
      WHERE t.kind <> 'round'
         OR t.cons_kind IS NOT NULL
         OR (t.ring_k IN ('county','country','world') AND t.course_id IS NOT NULL
             AND t.whs_score_id IS NOT NULL)
    ),
    scored AS (
      SELECT g.*,
        (g.seen_at IS NOT NULL AND g.arrived_at IS NOT NULL AND g.arrived_at < g.seen_at) AS is_seen,
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
          -- FRESHNESS IS ZERO IN THE BACKLOG LANE. Arrival cannot lend weight
          -- to a round played years ago.
          + (c_w_fresh * CASE WHEN s.lane_k = 'backlog' THEN 0
               ELSE power(0.5, greatest(0, extract(epoch FROM (now() - coalesce(s.arrived_at, now()))) / 3600.0) / c_half) END)
          + (c_w_not * s.notable)
        ) * CASE WHEN s.kind = 'story' THEN c_story ELSE 1 END AS sc
      FROM scored s
    ),
    news_win AS (
      SELECT q.* FROM ranked q
      WHERE q.lane_k = 'news'
        AND (v_cur_s IS NULL
             OR q.cid = ANY(v_carry)
             OR q.sc < v_cur_s
             OR (q.sc = v_cur_s AND q.cid > v_cur_i))
      ORDER BY q.sc DESC, q.cid ASC
      LIMIT v_limit * 6
    ),
    back_win AS (
      SELECT q.* FROM ranked q
      WHERE q.lane_k = 'backlog'
        AND (v_bl_s IS NULL
             OR q.sc < v_bl_s
             OR (q.sc = v_bl_s AND q.cid > v_bl_i))
      ORDER BY q.sc DESC, q.cid ASC
      LIMIT v_limit * 3
    )
    -- NEWS FIRST, ALWAYS. A backlog candidate is only ever reached when the
    -- news window ran out of placeable cards - that IS the "news falls below a
    -- page" gate, with no second count of the pool.
    SELECT * FROM (
      SELECT 0 AS lane_ord, n.* FROM news_win n
      UNION ALL
      SELECT 1 AS lane_ord, b.* FROM back_win b
    ) u
    ORDER BY u.lane_ord ASC, u.sc DESC, u.cid ASC

  LOOP
    -- THE BACKLOG BRANCH. Backlog candidates are only HELD here, in score
    -- order: the news lane gets the whole page first, including its cadence
    -- deferrals, and the backlog allowance is then spent on what is left in the
    -- tail pass below. Nothing is consumed - the backlog boundary advances only
    -- past rows actually placed - so no backlog card can be skipped.
    IF v_row.lane_k = 'backlog' THEN
      IF jsonb_array_length(v_back_hold) < v_limit * 3 THEN
        v_back_hold := v_back_hold || jsonb_build_array(to_jsonb(v_row));
      END IF;
      v_back_left := v_back_left + 1;
      CONTINUE;
    END IF;


    -- THE NEWS PATH, D1 VERBATIM. Only news moves the news keyset boundary.
    v_last_s := v_row.sc; v_last_i := v_row.cid;

    IF v_row.ring_k IN ('county','country','world') AND v_since_outer < c_gap THEN
      v_deferred := v_deferred || jsonb_build_array(to_jsonb(v_row));
      CONTINUE;
    END IF;

    -- A STORY NEVER LEADS - ON ANY PAGE. D1 only tested v_prev_key IS NULL, so
    -- a story could lead page 2 onward once the cadence tail was carried; the
    -- brief says never, so the lead test is now the position alone.
    IF v_prev_key = (coalesce(v_row.kind,'none') || ':' || coalesce(v_row.ring_k,'none'))
       OR (v_taken = 0 AND v_row.kind = 'story') THEN
      v_deferred := v_deferred || jsonb_build_array(to_jsonb(v_row));
      CONTINUE;
    END IF;


    v_out := v_out || jsonb_build_array(to_jsonb(v_row) || jsonb_build_object('relaxed', false));
    v_prev_key := coalesce(v_row.kind,'none') || ':' || coalesce(v_row.ring_k,'none');
    v_since_outer := CASE WHEN v_row.ring_k IN ('county','country','world') THEN 0
                          ELSE least(v_since_outer + 1, 1000000) END;
    v_since_back := least(v_since_back + 1, 1000000); v_news_placed := v_news_placed + 1;
    v_taken := v_taken + 1;

    IF jsonb_array_length(v_deferred) > 0 THEN
      DECLARE d jsonb := v_deferred -> 0;
      BEGIN
        IF NOT ((d ->> 'ring_k') IN ('county','country','world') AND v_since_outer < c_gap)
           AND v_prev_key IS DISTINCT FROM (coalesce(d ->> 'kind','none') || ':' || coalesce(d ->> 'ring_k','none')) THEN
          v_out := v_out || jsonb_build_array(d || jsonb_build_object('relaxed', false));
          v_deferred := v_deferred - 0;
          v_prev_key := coalesce(d ->> 'kind','none') || ':' || coalesce(d ->> 'ring_k','none');
          v_since_outer := CASE WHEN (d ->> 'ring_k') IN ('county','country','world') THEN 0
                                ELSE least(v_since_outer + 1, 1000000) END;
          v_since_back := least(v_since_back + 1, 1000000); v_news_placed := v_news_placed + 1;
          v_taken := v_taken + 1;
        END IF;
      END;
    END IF;

    EXIT WHEN v_taken >= v_limit;
  END LOOP;

  -- The documented D1 relaxation: what cadence could not place is appended
  -- rather than shortening the page. News only - the backlog lane is never
  -- deferred, so it never appears here.
  WHILE v_taken < v_limit AND jsonb_array_length(v_deferred) > 0 LOOP
    -- Even here a story may not lead: a non-story deferral is rotated forward.
    IF v_taken = 0 AND (v_deferred -> 0 ->> 'kind') = 'story'
       AND EXISTS (SELECT 1 FROM jsonb_array_elements(v_deferred) d
                   WHERE d ->> 'kind' IS DISTINCT FROM 'story') THEN
      v_deferred := (v_deferred - 0) || jsonb_build_array(v_deferred -> 0);
      CONTINUE;
    END IF;

    v_out := v_out || jsonb_build_array((v_deferred -> 0) || jsonb_build_object('relaxed', true));
    v_prev_key := coalesce(v_deferred -> 0 ->> 'kind','none') || ':' || coalesce(v_deferred -> 0 ->> 'ring_k','none');
    v_since_outer := CASE WHEN (v_deferred -> 0 ->> 'ring_k') IN ('county','country','world') THEN 0
                          ELSE least(v_since_outer + 1, 1000000) END;
    v_since_back := least(v_since_back + 1, 1000000); v_news_placed := v_news_placed + 1;
    v_deferred := v_deferred - 0;
    v_taken := v_taken + 1;
  END LOOP;

  -- THE BACKLOG TAIL. Held backlog rows are offered again, in score order, with
  -- the ring cap relaxed (marked relaxed, exactly like the news tail) but the
  -- ALLOWANCE STILL ENFORCED - one per c_back slots - and never in position 0.
  -- Without this a viewer whose news has run out would sit behind a ring cap
  -- that nothing can advance, and the backlog would be unreachable.
  WHILE v_taken > 0 AND v_taken < v_limit AND jsonb_array_length(v_back_hold) > 0
        AND v_since_back >= c_back - 1 LOOP
    v_out := v_out || jsonb_build_array((v_back_hold -> 0) || jsonb_build_object('relaxed', true));
    v_prev_key := coalesce(v_back_hold -> 0 ->> 'kind','none') || ':' || coalesce(v_back_hold -> 0 ->> 'ring_k','none');
    v_since_outer := CASE WHEN (v_back_hold -> 0 ->> 'ring_k') IN ('county','country','world') THEN 0
                          ELSE least(v_since_outer + 1, 1000000) END;
    v_bl_s := (v_back_hold -> 0 ->> 'sc')::numeric;
    v_bl_i := v_back_hold -> 0 ->> 'cid';
    v_since_back := 0;
    v_back_hold := v_back_hold - 0;
    v_back_left := greatest(v_back_left - 1, 0);
    v_taken := v_taken + 1;
    -- The next hold can only follow after c_back - 1 further placements, which
    -- this page has no news left to supply: one backlog card per short page.
    EXIT WHEN c_back > 1;
  END LOOP;



  RETURN QUERY
  SELECT
    r ->> 'cid',
    r ->> 'kind',
    r ->> 'ring_k',
    coalesce(r ->> 'lane_k', 'news'),
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
    coalesce((r ->> 'relaxed')::boolean, false),
    -- The cursor now carries BOTH lanes: the news boundary (s, i) plus the
    -- cadence tail, and the backlog boundary with its pacing gap.
    -- THE PAGE MAY GO SHORT WITHOUT THE STREAM ENDING. When the allowance turned
    -- backlog rows away, more remain, so the cursor lives on even on a short
    -- page - otherwise a thin-news viewer's backlog would be unreachable. The
    -- stream still terminates: a page that places NO news cannot open another
    -- (backlog may not lead), so the cursor goes NULL there.
    CASE WHEN v_taken < v_limit AND jsonb_array_length(v_deferred) = 0
              AND (v_back_left = 0 OR v_news_placed = 0) THEN NULL

         ELSE jsonb_build_object('s', v_last_s, 'i', v_last_i,
                'tail', jsonb_build_object(
                  'key', v_prev_key, 'since_outer', v_since_outer,
                  'since_back', v_since_back,
                  'bl', CASE WHEN v_bl_i IS NULL THEN NULL
                             ELSE jsonb_build_object('s', v_bl_s, 'i', v_bl_i) END,
                  'deferred', (SELECT coalesce(jsonb_agg(d ->> 'cid'), '[]'::jsonb)
                               FROM jsonb_array_elements(v_deferred) d))) END
  FROM jsonb_array_elements(v_out) AS r;
END;
$function$;
