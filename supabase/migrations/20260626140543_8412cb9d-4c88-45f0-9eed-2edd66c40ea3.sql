
CREATE OR REPLACE FUNCTION public.get_actor_dm_unread_counts()
RETURNS TABLE(actor_type text, actor_id uuid, unread_count integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH my_participants AS (
    SELECT cp.conversation_id, cp.last_read_at,
           'personal'::text AS a_type,
           auth.uid() AS a_id
    FROM public.conversation_participants cp
    WHERE cp.actor_type = 'personal'
      AND cp.user_id = auth.uid()
      AND cp.is_archived = false
    UNION ALL
    SELECT cp.conversation_id, cp.last_read_at,
           'business'::text AS a_type,
           cp.actor_id AS a_id
    FROM public.conversation_participants cp
    JOIN public.business_members bm
      ON bm.business_id = cp.actor_id
     AND bm.user_profile_id = auth.uid()
     AND bm.role IN ('owner','admin','editor')
    WHERE cp.actor_type = 'business'
      AND cp.is_archived = false
  ),
  unread_convs AS (
    SELECT mp.a_type, mp.a_id, mp.conversation_id
    FROM my_participants mp
    JOIN public.conversations c
      ON c.id = mp.conversation_id
     AND c.deleted_at IS NULL
     AND c.last_message_at IS NOT NULL
    WHERE EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.conversation_id = mp.conversation_id
        AND m.deleted_at IS NULL
        AND m.created_at > COALESCE(mp.last_read_at, '1970-01-01'::timestamptz)
        AND NOT (
          COALESCE(m.sender_actor_type, 'personal') = mp.a_type
          AND COALESCE(m.sender_actor_id, m.sender_id) = mp.a_id
        )
    )
  )
  SELECT a_type, a_id, COUNT(DISTINCT conversation_id)::int
  FROM unread_convs
  GROUP BY a_type, a_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_actor_dm_unread_counts() TO authenticated;
