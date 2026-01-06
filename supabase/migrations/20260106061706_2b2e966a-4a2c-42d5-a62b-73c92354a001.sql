-- Create RPC for reordering after course removal (avoids constraint violations)
CREATE OR REPLACE FUNCTION public.reorder_after_removal(
  p_user_id UUID,
  p_course_ids UUID[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Early exit if empty array
  IF array_length(p_course_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  -- Move all to temp range to avoid constraint violations
  UPDATE public.user_top_ten_courses
  SET position = position + 100
  WHERE user_id = p_user_id;
  
  -- Set final positions based on array order (1-indexed)
  UPDATE public.user_top_ten_courses utc
  SET position = v.new_pos,
      updated_at = NOW()
  FROM (
    SELECT 
      unnest(p_course_ids) AS course_id,
      generate_subscripts(p_course_ids, 1) AS new_pos
  ) v
  WHERE utc.user_id = p_user_id
    AND utc.course_id = v.course_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.reorder_after_removal(UUID, UUID[]) TO authenticated;