-- Fix: Update get_user_top100_intent function
-- The issue is that ORDER BY inside array_agg(DISTINCT ...) is invalid PostgreSQL syntax
-- Solution: Use a subquery to get ordered distinct values

CREATE OR REPLACE FUNCTION public.get_user_top100_intent(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  played_by_list jsonb;
  recent_courses uuid[];
  wishlist_lists text[];
  user_rank int;
BEGIN
  -- Get played counts by list
  SELECT jsonb_object_agg(t.slug, count_data.course_count)
  INTO played_by_list
  FROM (
    SELECT ctm.list_id, count(distinct uca.course_id) as course_count
    FROM user_course_activity uca
    JOIN course_top100_memberships ctm ON ctm.course_id = uca.course_id
    WHERE uca.user_id = target_user_id
      AND uca.is_top100 = true
    GROUP BY ctm.list_id
  ) count_data
  JOIN top100_lists t ON t.id = count_data.list_id;

  -- FIX: Get recent Top 100 courses using subquery for proper ordering
  -- PostgreSQL doesn't support ORDER BY inside array_agg(DISTINCT ...)
  SELECT array_agg(course_id)
  INTO recent_courses
  FROM (
    SELECT DISTINCT ON (uca.course_id) uca.course_id, uca.first_activity_at
    FROM user_course_activity uca
    JOIN course_top100_memberships ctm ON ctm.course_id = uca.course_id
    WHERE uca.user_id = target_user_id
      AND uca.is_top100 = true
    ORDER BY uca.course_id, uca.first_activity_at DESC
  ) ordered_courses
  ORDER BY first_activity_at DESC
  LIMIT 10;

  -- Get wishlist lists (lists where user has viewed courses but played < 3)
  SELECT array_agg(t.slug)
  INTO wishlist_lists
  FROM top100_lists t
  WHERE EXISTS (
    SELECT 1
    FROM course_top100_memberships ctm
    JOIN user_courses uc ON uc.course_id = ctm.course_id
    WHERE ctm.list_id = t.id
      AND uc.user_id = target_user_id
      AND uc.wishlist = true
  )
  AND (
    SELECT count(distinct uca.course_id)
    FROM user_course_activity uca
    JOIN course_top100_memberships ctm2 ON ctm2.course_id = uca.course_id
    WHERE uca.user_id = target_user_id
      AND ctm2.list_id = t.id
      AND uca.is_top100 = true
  ) < 3;

  -- Get leaderboard rank (worldwide, all time)
  SELECT rank INTO user_rank
  FROM (
    SELECT 
      uca.user_id,
      row_number() over (order by count(distinct uca.course_id) desc) as rank
    FROM user_course_activity uca
    WHERE uca.is_top100 = true
    GROUP BY uca.user_id
  ) ranked
  WHERE ranked.user_id = target_user_id;

  -- Build result
  result := jsonb_build_object(
    'total_top100_played', (
      SELECT count(distinct course_id)
      FROM user_course_activity
      WHERE user_id = target_user_id AND is_top100 = true
    ),
    'played_by_list', coalesce(played_by_list, '{}'::jsonb),
    'recent_course_ids', coalesce(recent_courses, array[]::uuid[]),
    'wishlist_list_slugs', coalesce(wishlist_lists, array[]::text[]),
    'leaderboard_rank', user_rank
  );

  RETURN result;
END;
$$;