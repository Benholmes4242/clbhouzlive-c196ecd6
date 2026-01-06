-- Fix the reorder_top_ten_courses RPC to work within the 1-10 constraint
-- Strategy: Delete affected rows and re-insert with new positions atomically

CREATE OR REPLACE FUNCTION reorder_top_ten_courses(
  p_user_id UUID,
  p_course_ids UUID[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_course_id UUID;
  v_new_position INT;
BEGIN
  IF array_length(p_course_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  -- Delete all the user's top ten entries for the provided courses
  DELETE FROM public.user_top_ten_courses
  WHERE user_id = p_user_id
    AND course_id = ANY(p_course_ids);
  
  -- Re-insert with new positions (1, 2, 3, ... based on array order)
  FOR i IN 1..array_length(p_course_ids, 1)
  LOOP
    INSERT INTO public.user_top_ten_courses (user_id, course_id, position, updated_at)
    VALUES (p_user_id, p_course_ids[i], i, NOW());
  END LOOP;
END;
$$;

-- Also fix reorder_after_removal to use same approach
CREATE OR REPLACE FUNCTION reorder_after_removal(
  p_user_id UUID,
  p_course_ids UUID[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF array_length(p_course_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  -- Delete existing entries
  DELETE FROM public.user_top_ten_courses
  WHERE user_id = p_user_id
    AND course_id = ANY(p_course_ids);
  
  -- Re-insert with packed positions
  FOR i IN 1..array_length(p_course_ids, 1)
  LOOP
    INSERT INTO public.user_top_ten_courses (user_id, course_id, position, updated_at)
    VALUES (p_user_id, p_course_ids[i], i, NOW());
  END LOOP;
END;
$$;