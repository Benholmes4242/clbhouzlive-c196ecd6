# docs/sql

Hand-run SQL. Nothing here is applied by the agent. Each file is a guarded
patch: it asserts the exact deployed body it was written against, refuses to run
twice, asserts an exact hit count for every replacement, and reads the result
back.

## STANDING RULE: A GUARD IS NOT A TEST. CALL THE FUNCTION.

Applies to every patch to `public.get_explore_stream`, and to any other
PL/pgSQL function rebuilt by string replacement.

On 15 September 2026 `explore_stream_net_facts.sql` installed a body that could
not run: it joined `whs_scores.whs_score_id`, a column that does not exist.
PL/pgSQL does not resolve column names until a query executes, so the md5
guard, the fingerprint chain and the read-back all passed, and every Explore
call then failed with `42703`. See `explore_stream_net_facts_ROLLBACK.sql`.

Therefore, in the SAME transaction as the `EXECUTE`, and BEFORE `COMMIT`:

1. Call the rebuilt function for real, on arguments that exercise every new
   code path:

   ```sql
   PERFORM count(*) FROM public.get_explore_stream(<viewer>, 'all',    'world', NULL, 12, NULL, NULL, NULL);
   PERFORM count(*) FROM public.get_explore_stream(<viewer>, 'scores', 'world', NULL, 30, NULL, NULL, NULL);
   ```

   The viewer must be a member whose page actually contains the rows the new
   CTEs join - for net facts, rounds with a handicap the viewer may see.

2. Assert the new work produced something, not merely that nothing threw. For
   net facts: at least one returned round has `facts->>'net' IS NOT NULL`,
   otherwise `RAISE`.

Any run-time error inside the transaction aborts it and nothing reaches
members. The md5 guard proves which body you patched; only a call proves the
result runs.

## STANDING RULE: PROVE COLUMNS, DO NOT RECALL THEM

Every table and column a new CTE touches gets an assertion in the guard block,
from `information_schema.columns` (and `pg_proc` for function signatures), that
`RAISE`s naming the missing object. List the checked columns in the file
header. Where a join key is not obvious, prove it by sampling rows and record
the sample in the header.
