-- Fix: preserve created_at while reordering, avoid unsafe DELETE warnings by using WHERE TRUE on temp table clears

CREATE OR REPLACE FUNCTION public.reorder_top_ten_courses(
  p_user_id UUID,
  p_course_ids UUID[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create temp table to preserve created_at timestamps
  CREATE TEMP TABLE IF NOT EXISTS temp_reorder (
    course_id UUID,
    created_at TIMESTAMPTZ,
    position INT
  ) ON COMMIT DROP;

  -- Clear temp table (add WHERE clause to satisfy safety requirement)
  DELETE FROM temp_reorder WHERE TRUE;

  -- Save current timestamps and new positions
  INSERT INTO temp_reorder (course_id, created_at, position)
  SELECT
    course_id,
    created_at,
    array_position(p_course_ids, course_id) as new_position
  FROM public.user_top_ten_courses
  WHERE user_id = p_user_id
    AND course_id = ANY(p_course_ids);

  -- Delete existing records
  DELETE FROM public.user_top_ten_courses
  WHERE user_id = p_user_id
    AND course_id = ANY(p_course_ids);

  -- Re-insert with preserved timestamps and new positions
  INSERT INTO public.user_top_ten_courses (user_id, course_id, position, created_at, updated_at)
  SELECT
    p_user_id,
    course_id,
    position,
    created_at,  -- Preserve original created_at
    NOW()        -- Update updated_at
  FROM temp_reorder;

  -- Cleanup (extra safety; temp table would also be dropped on commit)
  DROP TABLE IF EXISTS temp_reorder;
END;
$$;

CREATE OR REPLACE FUNCTION public.reorder_after_removal(
  p_user_id UUID,
  p_course_ids UUID[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create temp table to preserve created_at timestamps
  CREATE TEMP TABLE IF NOT EXISTS temp_removal_reorder (
    course_id UUID,
    created_at TIMESTAMPTZ,
    position INT
  ) ON COMMIT DROP;

  -- Clear temp table (add WHERE clause to satisfy safety requirement)
  DELETE FROM temp_removal_reorder WHERE TRUE;

  -- Save current timestamps and new positions
  INSERT INTO temp_removal_reorder (course_id, created_at, position)
  SELECT
    course_id,
    created_at,
    array_position(p_course_ids, course_id) as new_position
  FROM public.user_top_ten_courses
  WHERE user_id = p_user_id
    AND course_id = ANY(p_course_ids);

  -- Delete existing records
  DELETE FROM public.user_top_ten_courses
  WHERE user_id = p_user_id
    AND course_id = ANY(p_course_ids);

  -- Re-insert with preserved timestamps and new positions
  INSERT INTO public.user_top_ten_courses (user_id, course_id, position, created_at, updated_at)
  SELECT
    p_user_id,
    course_id,
    position,
    created_at,  -- Preserve original created_at
    NOW()        -- Update updated_at
  FROM temp_removal_reorder;

  -- Cleanup (extra safety; temp table would also be dropped on commit)
  DROP TABLE IF EXISTS temp_removal_reorder;
END;
$$;
