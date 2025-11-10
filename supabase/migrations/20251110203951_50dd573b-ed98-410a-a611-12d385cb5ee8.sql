-- Add tag filtering support to echo_history_search RPC

-- Ensure tags index exists
CREATE INDEX IF NOT EXISTS idx_echo_thread_tags_user_tag
  ON public.echo_thread_tags (user_id, tag);

-- Drop all three existing overloads explicitly
DROP FUNCTION IF EXISTS public.echo_history_search(
  text, boolean, timestamptz, timestamptz, text, int, int
);

DROP FUNCTION IF EXISTS public.echo_history_search(
  text, boolean, timestamptz, timestamptz, text, boolean, int, int
);

DROP FUNCTION IF EXISTS public.echo_history_search(
  text, boolean, timestamptz, timestamptz, text, boolean, text, int
);

-- Recreate with tag filter support
CREATE OR REPLACE FUNCTION public.echo_history_search(
  q                 text DEFAULT NULL,
  filter_has_response boolean DEFAULT NULL,
  date_from         timestamptz DEFAULT NULL,
  date_to           timestamptz DEFAULT NULL,
  mode              text DEFAULT NULL,
  filter_starred    boolean DEFAULT NULL,
  sort_mode         text DEFAULT 'default',
  max_results       int  DEFAULT 100,
  filter_tag        text DEFAULT NULL
)
RETURNS TABLE (
  thread_id uuid,
  first_user_question text,
  preview_snippet text,
  has_response boolean,
  is_starred boolean,
  last_activity_at timestamptz,
  message_count int,
  relative_date text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT et.id,
           et.user_id,
           et.has_response,
           et.is_starred,
           et.last_activity_at,
           et.message_count,
           et.tsv,
           et.first_user_question,
           et.preview_snippet,
           et.mode
    FROM echo_threads et
    WHERE et.user_id = _uid
      AND (filter_has_response IS NULL OR et.has_response = filter_has_response)
      AND (date_from IS NULL OR et.last_activity_at >= date_from)
      AND (date_to   IS NULL OR et.last_activity_at <  date_to)
      AND (mode IS NULL OR et.mode = mode)
      AND (filter_starred IS NULL OR et.is_starred = filter_starred)
      AND (
        filter_tag IS NULL OR EXISTS (
          SELECT 1
          FROM echo_thread_tags ett
          WHERE ett.thread_id = et.id
            AND ett.user_id   = _uid
            AND ett.tag = LOWER(filter_tag)
        )
      )
  ),
  ranked AS (
    SELECT b.*,
           CASE WHEN q IS NULL OR q = '' THEN NULL
                ELSE ts_rank(b.tsv, websearch_to_tsquery('english', q))
            END AS rnk
    FROM base b
    WHERE (q IS NULL OR q = '' OR b.tsv @@ websearch_to_tsquery('english', q))
  )
  SELECT
    r.id AS thread_id,
    r.first_user_question,
    r.preview_snippet,
    r.has_response,
    r.is_starred,
    r.last_activity_at,
    r.message_count,
    CASE
      WHEN r.last_activity_at > now() - interval '1 hour' THEN 'just now'
      WHEN r.last_activity_at > now() - interval '24 hours' THEN to_char(r.last_activity_at, 'HH24:MI')
      ELSE to_char(r.last_activity_at, 'YYYY-MM-DD')
    END AS relative_date
  FROM ranked r
  ORDER BY
    CASE
      WHEN sort_mode = 'starred'   THEN (CASE WHEN r.is_starred THEN 0 ELSE 1 END)
      WHEN sort_mode = 'relevance' THEN 0
      ELSE 0
    END,
    CASE WHEN sort_mode = 'relevance' THEN r.rnk END DESC NULLS LAST,
    r.last_activity_at DESC
  LIMIT LEAST(max_results, 500);
END $$;

REVOKE ALL ON FUNCTION public.echo_history_search FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.echo_history_search TO authenticated;