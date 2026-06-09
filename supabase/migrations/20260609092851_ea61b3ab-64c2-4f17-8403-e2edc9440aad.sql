
-- 1) get_legend_holders_for_courses — enforce champions_visibility per viewer
CREATE OR REPLACE FUNCTION public.get_legend_holders_for_courses(p_user_id uuid, p_course_ids uuid[])
 RETURNS TABLE(course_id uuid, category text, rank integer, user_id uuid, display_name text, photo_url text, value numeric, attained_at timestamp with time zone, is_self boolean, your_rank integer, your_value numeric, your_gap_to_first numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with all_legends as (
    select
      cl.course_id,
      cl.category,
      cl.rank,
      cl.user_id,
      up.display_name as display_name,
      up.profile_photo_url as photo_url,
      cl.value,
      cl.attained_at,
      (cl.user_id = p_user_id) as is_self,
      up.champions_visibility as champions_visibility
    from public.gam_course_legends cl
    join public.user_profiles up on up.id = cl.user_id
    where cl.course_id = any(p_course_ids)
      and cl.is_current = true
  ),
  visible_legends as (
    select *
    from all_legends al
    where
      al.is_self
      or coalesce(al.champions_visibility, 'everyone') = 'everyone'
      or (al.champions_visibility = 'friends' and public.are_friends(p_user_id, al.user_id))
  ),
  holders as (
    -- pick the lowest-ranked VISIBLE holder per course/category (rank stays true; hidden rank-1 leaves a gap)
    select distinct on (course_id, category)
      course_id, category, rank, user_id,
      display_name, photo_url, value, attained_at, is_self
    from visible_legends
    order by course_id, category, rank asc
  ),
  user_rows as (
    select
      al.course_id,
      al.category,
      al.rank as your_rank,
      al.value as your_value
    from all_legends al
    where al.is_self = true
  ),
  top_values as (
    -- compare against the TRUE top value (pre-visibility) so the viewer's
    -- gap reflects reality even if rank-1 is hidden from them.
    select distinct on (course_id, category)
      course_id, category, value as top_value
    from all_legends
    order by course_id, category, rank asc
  )
  select
    h.course_id,
    h.category,
    h.rank,
    h.user_id,
    h.display_name,
    h.photo_url,
    h.value,
    h.attained_at,
    h.is_self,
    ur.your_rank,
    ur.your_value,
    case
      when ur.your_value is not null and tv.top_value is not null
        then abs(ur.your_value - tv.top_value)
      else null
    end as your_gap_to_first
  from holders h
  left join user_rows ur
    on ur.course_id = h.course_id and ur.category = h.category
  left join top_values tv
    on tv.course_id = h.course_id and tv.category = h.category;
$function$;

-- 2) get_course_legends — add p_viewer_id (defaulted), apply champions_visibility
DROP FUNCTION IF EXISTS public.get_course_legends(uuid);
CREATE OR REPLACE FUNCTION public.get_course_legends(p_course_id uuid, p_viewer_id uuid DEFAULT auth.uid())
 RETURNS TABLE(category text, rank integer, user_id uuid, user_display_name text, user_photo_url text, user_home_club text, value numeric, attained_at timestamp with time zone, is_self boolean, total_count_in_category integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH base AS (
    SELECT
      cl.category,
      cl.rank,
      cl.user_id,
      up.display_name AS user_display_name,
      up.profile_photo_url AS user_photo_url,
      up.home_club AS user_home_club,
      cl.value,
      cl.attained_at,
      (cl.user_id = p_viewer_id) AS is_self,
      up.champions_visibility AS champions_visibility,
      -- TRUE total (pre-visibility) so "X of Y" labels don't shift
      COUNT(*) OVER (PARTITION BY cl.category)::int AS total_count_in_category
    FROM public.gam_course_legends cl
    JOIN public.user_profiles up ON up.id = cl.user_id
    WHERE cl.course_id = p_course_id
      AND cl.is_current = true
  )
  SELECT
    category, rank, user_id, user_display_name, user_photo_url, user_home_club,
    value, attained_at, is_self, total_count_in_category
  FROM base b
  WHERE
    b.is_self
    OR COALESCE(b.champions_visibility, 'everyone') = 'everyone'
    OR (b.champions_visibility = 'friends' AND public.are_friends(p_viewer_id, b.user_id))
  ORDER BY category, rank;
$function$;

-- 3) get_friends_who_held_legend — also honor champions_visibility = 'nobody'
CREATE OR REPLACE FUNCTION public.get_friends_who_held_legend(p_category text, p_course_id uuid, p_viewer_user_id uuid, p_limit integer DEFAULT 5)
 RETURNS TABLE(friend_user_id uuid, friend_name text, friend_avatar_url text, rank integer, value numeric, attained_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    cl.user_id AS friend_user_id,
    COALESCE(up.display_name, up.username, 'Friend') AS friend_name,
    up.profile_photo_url AS friend_avatar_url,
    cl.rank,
    cl.value,
    cl.attained_at
  FROM public.gam_course_legends cl
  JOIN public.user_profiles up ON up.id = cl.user_id
  WHERE cl.course_id = p_course_id
    AND cl.category = p_category
    AND cl.is_current = true
    AND cl.user_id != p_viewer_user_id
    AND COALESCE(up.champions_visibility, 'everyone') <> 'nobody'
    AND cl.user_id IN (
      SELECT wfm.friend_user_id
      FROM public.whs_friend_matches wfm
      WHERE wfm.owner_user_id = p_viewer_user_id
        AND wfm.friend_user_id IS NOT NULL
        AND wfm.is_clbhouz_user = true
    )
  ORDER BY cl.rank ASC
  LIMIT p_limit;
$function$;

-- 4) get_my_handicap_percentile — exclude handicap_page_visibility='nobody' from comparator population
CREATE OR REPLACE FUNCTION public.get_my_handicap_percentile()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_handicap numeric;
  v_visible boolean;
  v_user_bucket text;
  v_total int;
  v_buckets jsonb;
  v_better_than int;
  v_percentile_top int;
  v_cohort_min int := 20;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('available', false, 'reason', 'unauthenticated');
  END IF;

  SELECT eg_handicap_index, peer_comparison_visible
  INTO v_handicap, v_visible
  FROM public.user_profiles
  WHERE id = v_user_id;

  IF v_handicap IS NULL THEN
    RETURN jsonb_build_object('available', false, 'reason', 'missing_handicap');
  END IF;

  IF COALESCE(v_visible, true) = false THEN
    RETURN jsonb_build_object('available', false, 'reason', 'opted_out');
  END IF;

  v_user_bucket := CASE
    WHEN v_handicap < 0  THEN 'sub_zero'
    WHEN v_handicap < 5  THEN '0_4'
    WHEN v_handicap < 10 THEN '5_9'
    WHEN v_handicap < 15 THEN '10_14'
    WHEN v_handicap < 20 THEN '15_19'
    WHEN v_handicap < 25 THEN '20_24'
    ELSE                      'over_25'
  END;

  -- Compute cohort size from the LIVE user_profiles table so privacy
  -- exclusions take effect (was: SELECT MAX(total_count) FROM whs_handicap_distribution).
  SELECT COUNT(*)
  INTO v_total
  FROM public.user_profiles
  WHERE eg_handicap_index IS NOT NULL
    AND COALESCE(peer_comparison_visible, true) = true
    AND COALESCE(handicap_page_visibility, 'everyone') <> 'nobody';

  IF v_total IS NULL OR v_total = 0 THEN
    RETURN jsonb_build_object('available', false, 'reason', 'cohort_unavailable');
  END IF;

  IF v_total < v_cohort_min THEN
    RETURN jsonb_build_object(
      'available', false,
      'reason', 'cohort_too_small',
      'cohort_size', v_total
    );
  END IF;

  SELECT COUNT(*)
  INTO v_better_than
  FROM public.user_profiles
  WHERE eg_handicap_index IS NOT NULL
    AND COALESCE(peer_comparison_visible, true) = true
    AND COALESCE(handicap_page_visibility, 'everyone') <> 'nobody'
    AND eg_handicap_index > v_handicap;

  v_percentile_top := GREATEST(
    5,
    LEAST(
      95,
      (100 - (CEIL((v_better_than::numeric / v_total) * 20) * 5))::int
    )
  );

  SELECT jsonb_agg(
    jsonb_build_object(
      'bucket', bucket,
      'pct', ROUND((user_count::numeric / total_count) * 100, 1),
      'is_user_bucket', bucket = v_user_bucket
    )
    ORDER BY
      CASE bucket
        WHEN 'sub_zero' THEN 0
        WHEN '0_4'      THEN 1
        WHEN '5_9'      THEN 2
        WHEN '10_14'    THEN 3
        WHEN '15_19'    THEN 4
        WHEN '20_24'    THEN 5
        ELSE                 6
      END
  )
  INTO v_buckets
  FROM public.whs_handicap_distribution;

  RETURN jsonb_build_object(
    'available', true,
    'percentile_top', v_percentile_top,
    'user_bucket', v_user_bucket,
    'user_handicap', v_handicap,
    'cohort_size', v_total,
    'buckets', v_buckets
  );
END;
$function$;
