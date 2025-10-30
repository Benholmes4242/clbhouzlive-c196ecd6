-- Policy to prevent inserts on expired thread
DROP POLICY IF EXISTS gtm_insert ON public.game_thread_messages;

CREATE POLICY gtm_insert
ON public.game_thread_messages
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.game_threads t
    WHERE t.id = game_thread_messages.thread_id
      AND (EXTRACT(EPOCH FROM (t.expires_at + (COALESCE(t.grace_hours, 0) || ' hours')::INTERVAL)) * 1000) > EXTRACT(EPOCH FROM NOW()) * 1000
      AND COALESCE(t.is_closed, false) = false
  )
);

-- Policy for selecting messages (must be a thread participant)
DROP POLICY IF EXISTS gtm_select ON public.game_thread_messages;

CREATE POLICY gtm_select
ON public.game_thread_messages
FOR SELECT TO authenticated
USING (
  public.is_thread_member(thread_id)
);