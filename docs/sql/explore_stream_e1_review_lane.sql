-- E1 - a review can never leave the Explore news lane.
--
-- ONE CASE expression and ONE comment block change. Nothing else.
--
-- WHY THIS IS A DO BLOCK AND NOT A PASTED CREATE OR REPLACE.
-- The deployed body is 51,003 characters (definition 51,579; md5 of the whole
-- definition f36d7a98427bdd9834b1861637ddad1e, md5 of the body
-- bad7b99b8fdbf93dd13d4b6e0706cf52). No file in docs/sql/ matches it - the
-- largest saved body is 32,694 characters - so any pasted CREATE OR REPLACE
-- would be a reconstruction, which the brief forbids. This script instead reads
-- the LIVE definition with pg_get_functiondef, asserts the old lane text is
-- present EXACTLY ONCE, swaps in the new lane text, and executes the result.
-- The source of the statement is the live function itself, so no other
-- character of the function can change. If the assertion fails, nothing runs.
--
-- Two differences from the brief's snippets, both deliberate:
--   1. The live clause compares against v_anchor, NOT now(). One stream is
--      scored at one moment (the cursor carries 'at'). v_anchor is kept.
--   2. The brief's E1.2 asks for a header rewrite. The deployed function has NO
--      header docblock and no COMMENT ON FUNCTION - the only lane prose in the
--      database is the 6-line block replaced below, and its "(see header)"
--      points at a header that exists only in the repo drafts. The arrival/play
--      gap note it asks to keep is preserved inside the new block; the
--      rounds-only gap damp comments elsewhere in the body are untouched.
--
-- Nothing touches explore_config.

DO $do$
DECLARE
  v_def text;
  v_old text;
  v_new text;
  v_hits int;
BEGIN
  v_def := pg_get_functiondef(
    'public.get_explore_stream(uuid,text,text,jsonb,integer,uuid,text,text)'::regprocedure);

  v_old := $old$        -- THE LANE. ROUNDS ONLY, and keyed on ARRIVAL RECENCY (see header).
        -- A round that arrived within c_news days is news whenever it was
        -- played; one that arrived longer ago is backlog. play_date is the
        -- kicker's business and has NO say in the lane. A round with no arrival
        -- stamp cannot be SHOWN to be old, so it stays news rather than being
        -- buried on a missing value.
        CASE
          WHEN p.kind = 'round' AND p.arrived_at IS NOT NULL
               AND p.arrived_at < v_anchor - (c_news || ' days')::interval THEN 'backlog'
          ELSE 'news'
        END AS lane_k,$old$;

  v_new := $new$        -- THE LANE, keyed on ARRIVAL RECENCY. It applies to EVERY kind.
        -- It was `p.kind = 'round'`, which meant a review never aged out:
        -- reviews 104 and 127 days old were still being served in the news lane
        -- on page one, ahead of reviews written that afternoon. Arrival recency
        -- is not a round-specific idea - a review that arrived four months ago
        -- is not news. The arrival/play gap IS rounds-only - a WHS backfill can
        -- deliver a round played years ago - and it stays where it was: the
        -- kicker and the gap damp read it, the lane still ignores it entirely.
        -- An item with NO arrival stamp still stays news: absence cannot be
        -- shown to be age, and burying on a missing value is the wrong failure.
        CASE
          WHEN p.arrived_at IS NOT NULL
               AND p.arrived_at < v_anchor - (c_news || ' days')::interval THEN 'backlog'
          ELSE 'news'
        END AS lane_k,$new$;

  v_hits := (length(v_def) - length(replace(v_def, v_old, ''))) / length(v_old);

  IF v_hits <> 1 THEN
    RAISE EXCEPTION
      'E1 ABORTED: the live lane text matched % times, expected exactly 1. The deployed function has changed - re-read it before applying.',
      v_hits;
  END IF;

  EXECUTE replace(v_def, v_old, v_new);

  RAISE NOTICE 'E1 applied: the lane is now arrival recency for every kind.';
END
$do$;

-- VERIFY (Ben): substitute a real viewer uuid.
--
-- SELECT g.id, g.kind, g.lane, g.score
--   FROM get_explore_stream(
--          p_viewer := '<viewer uuid>', p_view := 'all', p_scope := 'world',
--          p_cursor := NULL, p_limit := 12,
--          p_club_id := NULL, p_county := NULL, p_country := NULL) g;
--
-- SELECT g.lane, count(*) FROM get_explore_stream(
--          p_viewer := '<viewer uuid>', p_view := 'courses', p_scope := 'world',
--          p_cursor := NULL, p_limit := 12,
--          p_club_id := NULL, p_county := NULL, p_country := NULL) g
--  GROUP BY 1;   -- expect 12 rows, all 'news': course rows carry no arrival stamp.
