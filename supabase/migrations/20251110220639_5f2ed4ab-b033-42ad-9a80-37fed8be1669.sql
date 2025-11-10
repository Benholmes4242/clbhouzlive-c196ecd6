-- ================================================
-- Echo History Tag Management RPC Functions
-- ================================================

-- 1. RPC: Add tags to thread (upsert tag names & attach)
CREATE OR REPLACE FUNCTION public.echo_tags_add_to_thread(
  p_thread UUID,
  p_names TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID := auth.uid();
  v_tag_id UUID;
  v_name TEXT;
BEGIN
  IF p_thread IS NULL OR p_names IS NULL THEN 
    RETURN; 
  END IF;

  -- Ensure thread owner
  IF NOT EXISTS (
    SELECT 1 FROM echo_threads t 
    WHERE t.id = p_thread AND t.user_id = v_owner
  ) THEN
    RAISE EXCEPTION 'Not allowed to edit tags on this thread';
  END IF;

  FOREACH v_name IN ARRAY p_names LOOP
    v_name := trim(v_name);
    IF v_name = '' THEN CONTINUE; END IF;

    -- Upsert tag
    INSERT INTO echo_tags (owner_id, name)
    VALUES (v_owner, v_name)
    ON CONFLICT (owner_id, name_norm) 
    DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_tag_id;

    -- Attach to thread
    INSERT INTO echo_thread_tags(thread_id, tag_id)
    VALUES (p_thread, v_tag_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 2. RPC: Set all tags for a thread (replace)
CREATE OR REPLACE FUNCTION public.echo_tags_set_for_thread(
  p_thread UUID,
  p_names TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID := auth.uid();
BEGIN
  IF p_thread IS NULL THEN 
    RETURN; 
  END IF;

  -- Authorize
  IF NOT EXISTS (
    SELECT 1 FROM echo_threads t 
    WHERE t.id = p_thread AND t.user_id = v_owner
  ) THEN
    RAISE EXCEPTION 'Not allowed to edit tags on this thread';
  END IF;

  -- Resolve tag IDs for names (create missing)
  WITH upserted AS (
    INSERT INTO echo_tags(owner_id, name)
    SELECT v_owner, n
    FROM unnest(COALESCE(p_names, '{}')) AS n
    WHERE trim(n) <> ''
    ON CONFLICT (owner_id, name_norm) 
    DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  ), wanted AS (
    SELECT id FROM upserted
    UNION
    SELECT et.id
    FROM echo_tags et
    WHERE et.owner_id = v_owner
      AND et.name_norm = ANY (
        SELECT lower(trim(n)) 
        FROM unnest(COALESCE(p_names,'{}')) n 
        WHERE trim(n) <> ''
      )
  )
  -- Delete tags not in wanted list
  , deleted AS (
    DELETE FROM echo_thread_tags ett
    USING echo_tags et
    WHERE ett.thread_id = p_thread
      AND ett.tag_id = et.id
      AND et.owner_id = v_owner
      AND ett.tag_id NOT IN (SELECT id FROM wanted)
  )
  -- Insert missing tags
  INSERT INTO echo_thread_tags(thread_id, tag_id)
  SELECT p_thread, id FROM wanted
  ON CONFLICT DO NOTHING;
END $$;

-- 3. RPC: Remove a single tag from a thread
CREATE OR REPLACE FUNCTION public.echo_tags_remove_from_thread(
  p_thread UUID,
  p_name TEXT
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM echo_thread_tags ett
  USING echo_tags et, echo_threads th
  WHERE ett.thread_id = p_thread
    AND ett.tag_id = et.id
    AND th.id = p_thread
    AND th.user_id = auth.uid()
    AND et.owner_id = auth.uid()
    AND et.name_norm = lower(trim(p_name));
$$;

-- 4. RPC: Suggest tags by prefix
CREATE OR REPLACE FUNCTION public.echo_tags_suggest(
  p_prefix TEXT DEFAULT NULL,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT name
  FROM echo_tags
  WHERE owner_id = auth.uid()
    AND (p_prefix IS NULL OR name ILIKE p_prefix || '%')
  ORDER BY name_norm ASC
  LIMIT COALESCE(p_limit, 10);
$$;