-- ============================================================================
-- BRIEF_EXPLORE_MAGAZINE - PHASE D3 DRAFT. BEN RUNS THIS. NOT A MIGRATION.
-- ============================================================================
-- THE REMAINING VIEWS. Built on the DEPLOYED get_explore_stream: its body was
-- dumped with pg_get_functiondef before this file was written and proved
-- BYTE-IDENTICAL to docs/sql/explore_stream_d2.sql (prosrc md5
-- e949b1b72c8aabbfbb881dbbbf567af1, 25209 chars), so this file is that live body
-- with the changes below and nothing else. The D1 file is not authoritative.
--
-- WHAT CHANGES, AND ONLY THIS:
--   1. p_view accepts 'all', 'scores', 'courses' and 'reviews'. The candidate
--      pool is the view's own: scores = rounds, reviews = prose reviews,
--      courses = a new course-card CTE, all = rounds + reviews + stories exactly
--      as D1/D2 shipped. WATCH IS NOT IN THE RPC - see THE WATCH DECISION.
--   2. p_scope filters candidates by the SUBJECT COURSE's geography: club_id =
--      p_club_id, region = p_county, sub_country = p_country, world unfiltered.
--      The All view is NOT scope-filtered - that is D1 behaviour, preserved.
--   3. The cadence key becomes per-view (cad_k). Phases B2 and C shipped and Ben
--      approved a SINGLE-TYPE cadence: scores and reviews alternate on the
--      CONSEQUENCE kind, courses on the EVENT kind (ratings burst / recent low /
--      stable fact), All still alternates on kind:ring, unchanged.
--   4. The outer-ring cap stays an ALL-VIEW rule. In a scoped single-type view
--      nearly every card shares one ring, so applying it would defer the whole
--      page into the relaxation tail and change an order Ben already accepted.
--      Geography in those views is bounded by p_scope instead.
--   5. Ranking per view reproduces what shipped. All and Scores keep the D1/D2
--      formula VERBATIM (so the backlog lane keeps working on Scores). Reviews
--      rank consequence, then rating, then freshness. Courses rank event
--      strength, then rating, then tracked rounds - the same arithmetic as
--      src/features/explore-magazine/useCoursesView.ts.
--
-- GEOGRAPHY IS PASSED, NEVER RE-RESOLVED. p_club_id / p_county / p_country come
-- from the shared client resolver (useViewerScoreScope). This function does not
-- read primary_club_id, does not read home_club free text, and does not infer a
-- county from a member's rounds. A viewer with no club asking for 'club' gets
-- nothing, by construction.
--
-- STANDING IS CALLED, NEVER RE-DERIVED. public.get_viewer_standing supplies
-- rank_now / field_now in every view, so a card's n / of equals the "Where you
-- stand" shelf on the same page. There is no rank() and no
-- count(distinct user_id) in this file. Ties are still REJECTED, not resolved
-- (holders ... HAVING count(*) = 1).
--
-- THE PROSE QUALIFICATION SURVIVES: btrim(review) <> '' means a score-only
-- rating is never a candidate, in the Reviews view or in All.
--
-- THE COURSE CANDIDATE RULE: a course with NEITHER tracked rounds NOR a rating
-- has no honest sentence and is not selected at all.
--
-- CARRIED FROM D2, ACCEPTED BY BEN, DO NOT "FIX": when a viewer's news lane is
-- exhausted past the cursor an all-backlog page may open, because a page that
-- places nothing ends the stream and would strand a backfilled member's
-- history. While ANY news remains, backlog never leads. Also carried: a story
-- never leads a page, tested on POSITION alone (D1 tested v_prev_key IS NULL,
-- so a story could lead page 2 onward once the cadence tail travelled).
--
-- THE WATCH DECISION, REPORTED NOT HIDDEN: WATCH STAYS CLIENT-COMPOSED. Its
-- sources are clips and long-form video, which are not in this pool and whose
-- depth is bounded by the media hooks that already ship. Watch therefore keeps
-- its current finite depth - a stated limit, not a defect. Bringing
-- Cloudflare-backed media into the ranker is a separate phase.
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
  v_view     text;    v_scope  text;    -- normalised view / scope (D3)
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
  v_news_seen integer := 0;              -- news CANDIDATES this page had at all


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

  v_view  := lower(coalesce(nullif(btrim(p_view),  ''), 'all'));
  v_scope := lower(coalesce(nullif(btrim(p_scope), ''), 'world'));

  -- WATCH IS CLIENT-COMPOSED (see header). An unknown view returns nothing
  -- rather than guessing a pool; the client keeps its accepted composition.
  IF v_view NOT IN ('all', 'scores', 'courses', 'reviews') THEN
    RETURN;
  END IF;

  v_cur_s       := nullif(p_cursor -> 's', 'null')::text::numeric;
  v_cur_i       := p_cursor ->> 'i';
  v_prev_key    := p_cursor #>> '{tail,key}';
  v_since_outer := coalesce((p_cursor #>> '{tail,since_outer}')::int, 1000000);
  v_bl_s        := nullif(p_cursor #> '{tail,bl,s}', 'null')::text::numeric;
  v_bl_i        := p_cursor #>> '{tail,bl,i}';
  v_since_back  := coalesce((p_cursor #>> '{tail,since_back}')::int, 1000000);
  -- The news boundary CARRIES even when a page places no news at all (an
  -- all-backlog page), or the next page would restart the news lane and repeat
  -- cards already served.
  v_last_s := v_cur_s; v_last_i := v_cur_i;

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
    -- COURSE-CARD FACTS (Courses view only) -----------------------------------
    c_rounds AS (
      SELECT g.course_id, count(*)::int AS rounds_tracked
      FROM public.gam_round_stats g
      WHERE g.holes_played = 18 AND g.course_id IS NOT NULL
      GROUP BY g.course_id
    ),
    c_rating AS (
      SELECT r.course_id, avg(r.rating)::numeric AS mean, count(*)::int AS n
      FROM public.course_ratings r
      WHERE coalesce(r.is_mock, false) = false AND r.rating IS NOT NULL
      GROUP BY r.course_id
    ),
    c_burst AS (
      SELECT r.course_id, count(*)::int AS burst_n, avg(r.rating)::numeric AS burst_mean
      FROM public.course_ratings r
      WHERE coalesce(r.is_mock, false) = false AND r.rating IS NOT NULL
        AND r.created_at >= now() - interval '30 days'
      GROUP BY r.course_id
    ),
    c_low AS (
      SELECT DISTINCT ON (g.course_id)
             g.course_id, g.gross_score AS low_gross, up.display_name AS low_by
      FROM public.gam_round_stats g
      JOIN public.user_profiles up ON up.id = g.user_id
      WHERE g.holes_played = 18 AND g.course_id IS NOT NULL
        AND g.gross_score IS NOT NULL
        AND g.play_date >= (now() - interval '30 days')::date
      ORDER BY g.course_id, g.gross_score ASC, g.id ASC
    ),
    c_top AS (
      SELECT m.course_id,
             min(m.rank) FILTER (WHERE l.slug =  'top-100-worldwide') AS world_rank,
             min(m.rank) FILTER (WHERE l.slug <> 'top-100-worldwide') AS regional_rank
      FROM public.course_top100_memberships m
      JOIN public.top100_lists l ON l.id = m.list_id
      WHERE m.rank IS NOT NULL
      GROUP BY m.course_id
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
        NULL::text AS review_id, NULL::text AS first_sentence,
        NULL::integer AS rounds_tracked, NULL::integer AS low_gross,
        NULL::text AS low_by, NULL::integer AS burst_n, NULL::numeric AS burst_mean,
        NULL::text AS course_event, NULL::integer AS top100_world,
        NULL::integer AS top100_regional
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
        NULL::integer, NULL::integer, NULL::text, NULL::integer, NULL::numeric,
        NULL::text, NULL::integer, NULL::integer
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
        NULL::text, NULL::text,
        NULL::integer, NULL::integer, NULL::text, NULL::integer, NULL::numeric,
        NULL::text, NULL::integer, NULL::integer
      FROM public.amateur_stories s
      WHERE s.published_at IS NOT NULL AND s.published_at <= now()
    ),
    -- COURSES ----------------------------------------------------------------
    -- The headline ladder travels as FACTS (event kind plus its figures) and is
    -- rendered by the client in the member's own language: SQL cannot localise
    -- six locales. Ratings burst beats a recent low beats a stable fact.
    courses AS (
      SELECT
        'course:' || c.id::text, 'course'::text,
        NULL::timestamptz, NULL::text,
        c.id, c.name, c.region, c.sub_country, c.thumbnail_image, c.club_id,
        NULL::uuid, NULL::text, NULL::text,
        false, false,
        NULL::integer, NULL::integer, NULL::integer, NULL::integer,
        NULL::uuid, NULL::integer, NULL::integer, NULL::integer, NULL::integer,
        NULL::boolean, NULL::numeric,
        false, false,
        NULL::integer, NULL::integer, NULL::integer, NULL::integer,
        NULL::integer,
        (sl.course_id IS NOT NULL),
        cr.mean, cr.n,
        NULL::text, NULL::text, NULL::text,
        NULL::text, NULL::text,
        cn.rounds_tracked, cl.low_gross, cl.low_by, cb.burst_n, cb.burst_mean,
        CASE WHEN coalesce(cb.burst_n, 0) >= 2 THEN 'ratings'
             WHEN cl.low_gross IS NOT NULL     THEN 'low'
             ELSE 'stable' END,
        ct.world_rank,
        -- WORLD OUTRANKS REGIONAL, NEVER BOTH.
        CASE WHEN ct.world_rank IS NULL THEN ct.regional_rank END
      FROM public.golf_courses c
      LEFT JOIN c_rounds cn ON cn.course_id = c.id
      LEFT JOIN c_rating cr ON cr.course_id = c.id
      LEFT JOIN c_burst  cb ON cb.course_id = c.id
      LEFT JOIN c_low    cl ON cl.course_id = c.id
      LEFT JOIN c_top    ct ON ct.course_id = c.id
      LEFT JOIN shortlist sl ON sl.course_id = c.id
      -- NEITHER ROUNDS NOR A RATING IS NOT A CANDIDATE.
      WHERE coalesce(cn.rounds_tracked, 0) > 0 OR coalesce(cr.n, 0) > 0
    ),
    -- THE POOL IS THE VIEW'S OWN.
    pool AS (
      SELECT * FROM rounds  WHERE v_view IN ('all', 'scores')
      UNION ALL
      SELECT * FROM reviews WHERE v_view IN ('all', 'reviews')
      UNION ALL
      SELECT * FROM stories WHERE v_view = 'all'
      UNION ALL
      SELECT * FROM courses WHERE v_view = 'courses'
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
      SELECT t.*,
        -- THE CADENCE KEY IS THE VIEW'S OWN (header note 3). All is unchanged.
        CASE v_view
          WHEN 'courses' THEN 'course:' || coalesce(t.course_event, 'stable')
          WHEN 'scores'  THEN coalesce(t.cons_kind, 'plain')
          WHEN 'reviews' THEN coalesce(t.cons_kind, 'plain')
          -- All keeps kind:ring exactly as D1/D2 shipped. The single-type views
          -- key on the CONSEQUENCE or EVENT alone: with the pool bounded by
          -- p_scope, leaving the ring in the key would let the same consequence
          -- repeat back to back merely because the two cards sat in different
          -- rings, which is what Phases B2/C set out to stop.
          ELSE coalesce(t.kind, 'none') || ':' || coalesce(t.ring_k, 'none')
        END AS cad_k
      FROM typed t
      WHERE (t.kind <> 'round'
             OR t.cons_kind IS NOT NULL
             OR (t.ring_k IN ('county','country','world') AND t.course_id IS NOT NULL
                 AND t.whs_score_id IS NOT NULL))
        -- SCOPE, PASSED IN AND NEVER RESOLVED HERE. All stays unscoped (D1).
        AND (v_view = 'all' OR v_scope = 'world'
             OR (v_scope = 'club'    AND p_club_id IS NOT NULL AND t.club_id     = p_club_id)
             OR (v_scope = 'county'  AND p_county  IS NOT NULL AND t.region      = p_county)
             OR (v_scope = 'country' AND p_country IS NOT NULL AND t.sub_country = p_country))
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
        CASE
          -- COURSES: event strength, then rating, then tracked rounds - the
          -- accepted client arithmetic, not a new model.
          WHEN v_view = 'courses' THEN
            (CASE WHEN s.course_event = 'ratings'
                    THEN 2 + least(coalesce(s.burst_n, 0), 12)::numeric / 12
                  WHEN s.course_event = 'low' THEN 1
                  ELSE 0 END) * 100
            + coalesce(s.rating, 0) * 5
            + least(coalesce(s.rounds_tracked, 0), 100)::numeric / 100
          -- REVIEWS: consequence, then rating, then freshness. The binary seen
          -- damp still touches the consequence term only.
          WHEN v_view = 'reviews' THEN
            (s.cons_w * CASE WHEN s.is_seen THEN c_seen ELSE 1 END) * 1000
            + coalesce(s.rating, 0) * 10
            + power(0.5, greatest(0, extract(epoch FROM (now() - coalesce(s.arrived_at, now()))) / 3600.0) / c_half)
          -- ALL and SCORES: the D1/D2 formula, verbatim.
          ELSE (
          (c_w_cons * s.cons_w * CASE WHEN s.is_seen THEN c_seen ELSE 1 END)
          + (c_w_ring * s.ring_w * CASE WHEN s.is_seen THEN c_seen ELSE 1 END)
          -- FRESHNESS IS ZERO IN THE BACKLOG LANE. Arrival cannot lend weight
          -- to a round played years ago.
          + (c_w_fresh * CASE WHEN s.lane_k = 'backlog' THEN 0
               ELSE power(0.5, greatest(0, extract(epoch FROM (now() - coalesce(s.arrived_at, now()))) / 3600.0) / c_half) END)
          + (c_w_not * s.notable)
        ) * CASE WHEN s.kind = 'story' THEN c_story ELSE 1 END
        END AS sc
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
    v_news_seen := v_news_seen + 1;
    v_last_s := v_row.sc; v_last_i := v_row.cid;


    -- THE OUTER-RING CAP IS AN ALL-VIEW RULE (header note 4).
    IF v_view = 'all' AND v_row.ring_k IN ('county','country','world') AND v_since_outer < c_gap THEN
      v_deferred := v_deferred || jsonb_build_array(to_jsonb(v_row));
      CONTINUE;
    END IF;

    -- A STORY NEVER LEADS - ON ANY PAGE. D1 only tested v_prev_key IS NULL, so
    -- a story could lead page 2 onward once the cadence tail was carried; the
    -- brief says never, so the lead test is now the position alone.
    IF v_prev_key = (coalesce(v_row.cad_k,'none'))
       OR (v_taken = 0 AND v_row.kind = 'story') THEN
      v_deferred := v_deferred || jsonb_build_array(to_jsonb(v_row));
      CONTINUE;
    END IF;


    v_out := v_out || jsonb_build_array(to_jsonb(v_row) || jsonb_build_object('relaxed', false));
    v_prev_key := coalesce(v_row.cad_k,'none');
    v_since_outer := CASE WHEN v_row.ring_k IN ('county','country','world') THEN 0
                          ELSE least(v_since_outer + 1, 1000000) END;
    v_since_back := least(v_since_back + 1, 1000000); v_news_placed := v_news_placed + 1;
    v_taken := v_taken + 1;

    IF jsonb_array_length(v_deferred) > 0 THEN
      DECLARE d jsonb := v_deferred -> 0;
      BEGIN
        IF NOT (v_view = 'all' AND (d ->> 'ring_k') IN ('county','country','world') AND v_since_outer < c_gap)
           AND v_prev_key IS DISTINCT FROM (coalesce(d ->> 'cad_k','none')) THEN
          v_out := v_out || jsonb_build_array(d || jsonb_build_object('relaxed', false));
          v_deferred := v_deferred - 0;
          v_prev_key := coalesce(d ->> 'cad_k','none');
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
    v_prev_key := coalesce(v_deferred -> 0 ->> 'cad_k','none');
    v_since_outer := CASE WHEN (v_deferred -> 0 ->> 'ring_k') IN ('county','country','world') THEN 0
                          ELSE least(v_since_outer + 1, 1000000) END;
    v_since_back := least(v_since_back + 1, 1000000); v_news_placed := v_news_placed + 1;
    v_deferred := v_deferred - 0;
    v_taken := v_taken + 1;
  END LOOP;

  -- THE BACKLOG TAIL. Held backlog rows are placed here, in score order, only
  -- once the news lane has had the whole page - which IS the "news first" gate.
  -- Two cases, and the second is a DELIBERATE DEPARTURE FROM THE BRIEF, filed
  -- for Ben rather than hidden:
  --   a. The page still had news candidates: the allowance applies, so at most
  --      one backlog card joins it and never in position 0.
  --   b. The viewer's news lane is EXHAUSTED (no news candidate at all past the
  --      boundary). The brief says a backlog card may never lead a page; obeyed
  --      literally, such a viewer's 200 backfilled rounds would be unreachable
  --      after a single card, because a page that places nothing ends the
  --      stream. So when there is no news left to lead with, an all-backlog
  --      page opens. While ANY news remains, backlog never leads.
  IF v_news_seen = 0 THEN
    WHILE v_taken < v_limit AND jsonb_array_length(v_back_hold) > 0 LOOP
      v_out := v_out || jsonb_build_array((v_back_hold -> 0) || jsonb_build_object('relaxed', true));
      v_prev_key := coalesce(v_back_hold -> 0 ->> 'cad_k','none');
      v_since_outer := 0;
      v_bl_s := (v_back_hold -> 0 ->> 'sc')::numeric;
      v_bl_i := v_back_hold -> 0 ->> 'cid';
      v_since_back := 0;
      v_back_hold := v_back_hold - 0;
      v_back_left := greatest(v_back_left - 1, 0);
      v_taken := v_taken + 1;
    END LOOP;
  ELSE
    WHILE v_taken > 0 AND v_taken < v_limit AND jsonb_array_length(v_back_hold) > 0
          AND v_since_back >= c_back - 1 LOOP
      v_out := v_out || jsonb_build_array((v_back_hold -> 0) || jsonb_build_object('relaxed', true));
      v_prev_key := coalesce(v_back_hold -> 0 ->> 'cad_k','none');
      v_since_outer := CASE WHEN (v_back_hold -> 0 ->> 'ring_k') IN ('county','country','world') THEN 0
                            ELSE least(v_since_outer + 1, 1000000) END;
      v_bl_s := (v_back_hold -> 0 ->> 'sc')::numeric;
      v_bl_i := v_back_hold -> 0 ->> 'cid';
      v_since_back := 0;
      v_back_hold := v_back_hold - 0;
      v_back_left := greatest(v_back_left - 1, 0);
      v_taken := v_taken + 1;
      -- The next one may only follow after c_back - 1 further placements, which
      -- a page short of news cannot supply: one backlog card per short page.
      EXIT WHEN c_back > 1;
    END LOOP;
  END IF;




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
      'hcp_at_time', r -> 'hcp_at_time',
      -- COURSE-CARD FACTS. 'rating' above is the course's own average and
      -- 'rating_n' its sample; the client composes the localized sentence.
      'rating_n', CASE WHEN r ->> 'kind' = 'course' THEN r -> 'rating_n' END,
      'rounds_tracked', r -> 'rounds_tracked',
      'low_gross', r -> 'low_gross', 'low_by', r -> 'low_by',
      'ratings_burst_n', r -> 'burst_n', 'ratings_burst_mean', r -> 'burst_mean',
      'course_event', r -> 'course_event',
      'top100_world', r -> 'top100_world',
      'top100_regional', r -> 'top100_regional')),
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
              AND (v_back_left = 0 OR v_taken = 0) THEN NULL

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
