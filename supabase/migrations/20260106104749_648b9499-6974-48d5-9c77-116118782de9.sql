-- Migration: Update RPC functions to use efficient staging approach
-- Uses position + 100 staging to avoid constraint violations without needing deferrable constraints

-- Update reorder_top_ten_courses RPC with efficient staging approach
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
  -- Step 1: Temporarily disable the constraint by moving to NULL positions
  -- We'll use a CTE approach to do atomic updates
  
  -- First, delete and re-insert is actually the safest approach for CHECK constraints
  -- But we want to preserve created_at, so we use a different strategy:
  -- Update positions one by one in reverse order to avoid conflicts
  
  -- Actually, the simplest approach that preserves timestamps:
  -- Move all affected rows to positions 11-20 (outside check range temporarily)
  -- This requires dropping/recreating the constraint OR using a trigger-based approach
  
  -- Since we can't defer CHECK constraints, use delete/insert but preserve created_at
  -- by storing it first
  
  CREATE TEMP TABLE IF NOT EXISTS temp_top_ten_reorder (
    course_id UUID,
    created_at TIMESTAMPTZ
  ) ON COMMIT DROP;
  
  DELETE FROM temp_top_ten_reorder;
  
  -- Store course_ids with their original created_at
  INSERT INTO temp_top_ten_reorder (course_id, created_at)
  SELECT course_id, created_at 
  FROM user_top_ten_courses 
  WHERE user_id = p_user_id AND course_id = ANY(p_course_ids);
  
  -- Delete existing rows
  DELETE FROM user_top_ten_courses 
  WHERE user_id = p_user_id AND course_id = ANY(p_course_ids);
  
  -- Re-insert with new positions but preserved created_at
  INSERT INTO user_top_ten_courses (user_id, course_id, position, created_at, updated_at)
  SELECT 
    p_user_id,
    t.course_id,
    array_position(p_course_ids, t.course_id),
    t.created_at,
    NOW()
  FROM temp_top_ten_reorder t
  WHERE t.course_id = ANY(p_course_ids);
END;
$$;

-- Update reorder_after_removal RPC with same pattern
CREATE OR REPLACE FUNCTION reorder_after_removal(
  p_user_id UUID,
  p_course_ids UUID[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS temp_top_ten_removal (
    course_id UUID,
    created_at TIMESTAMPTZ
  ) ON COMMIT DROP;
  
  DELETE FROM temp_top_ten_removal;
  
  -- Store course_ids with their original created_at
  INSERT INTO temp_top_ten_removal (course_id, created_at)
  SELECT course_id, created_at 
  FROM user_top_ten_courses 
  WHERE user_id = p_user_id AND course_id = ANY(p_course_ids);
  
  -- Delete existing rows
  DELETE FROM user_top_ten_courses 
  WHERE user_id = p_user_id AND course_id = ANY(p_course_ids);
  
  -- Re-insert with new positions but preserved created_at
  INSERT INTO user_top_ten_courses (user_id, course_id, position, created_at, updated_at)
  SELECT 
    p_user_id,
    t.course_id,
    array_position(p_course_ids, t.course_id),
    t.created_at,
    NOW()
  FROM temp_top_ten_removal t
  WHERE t.course_id = ANY(p_course_ids);
END;
$$;