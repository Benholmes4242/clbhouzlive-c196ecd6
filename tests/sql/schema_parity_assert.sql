-- SCHEMA PARITY GUARD (AUDIT RULING 3, brief item 7b). NOT production SQL.
--
-- Fails the harness on ANY column-set difference between the local fixture and
-- the checked-in production snapshot. Run IMMEDIATELY after the fixtures and
-- BEFORE the function bodies, so a drifted fixture stops the run instead of
-- producing green assertions about a schema that does not exist.
--
-- THE TWO QUERIES THAT PRODUCE THE SNAPSHOT (run against the project, read-only):
--   select table_name, column_name, data_type from information_schema.columns
--    where table_schema='public' and table_name in (<narrow tables>)
--    order by table_name, ordinal_position;
--   -- and the same, restricted to the declared subset for the wide tables.
--
-- WHAT IT CATCHES, IN BOTH DIRECTIONS:
--   A. a fixture column production does NOT have (gam_round_stats.id - the one
--      that cost four live views);
--   B. a production column the fixture is MISSING, which lets a predicate the
--      deployed body relies on go untested;
--   C. a type difference (eg_handicap_index double precision vs numeric).
\set ON_ERROR_STOP on

do $$
declare
  v_msg text := '';
  r record;
begin
  /* A - fixture has a column production does not. */
  for r in
    select c.table_name, c.column_name
    from information_schema.columns c
    join (select distinct table_name from prod_columns) t
      on t.table_name = c.table_name
    where c.table_schema = 'public'
      and not exists (
        select 1 from prod_columns p
        where p.table_name = c.table_name and p.column_name = c.column_name)
    order by 1, 2
  loop
    v_msg := v_msg || format(E'\n  INVENTED: %s.%s is not in production',
                             r.table_name, r.column_name);
  end loop;

  /* B - production has a column the fixture is missing. */
  for r in
    select p.table_name, p.column_name
    from prod_columns p
    where not exists (
      select 1 from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = p.table_name and c.column_name = p.column_name)
    order by 1, 2
  loop
    v_msg := v_msg || format(E'\n  MISSING:  %s.%s is in production and not in the fixture',
                             r.table_name, r.column_name);
  end loop;

  /* C - the column exists in both, with different types. */
  for r in
    select p.table_name, p.column_name, p.data_type as prod, c.data_type as fixture
    from prod_columns p
    join information_schema.columns c
      on c.table_schema = 'public'
     and c.table_name = p.table_name and c.column_name = p.column_name
    where c.data_type <> p.data_type
    order by 1, 2
  loop
    v_msg := v_msg || format(E'\n  TYPE:     %s.%s is %s in production, %s in the fixture',
                             r.table_name, r.column_name, r.prod, r.fixture);
  end loop;

  if v_msg <> '' then
    raise exception E'SCHEMA PARITY FAIL - the fixture does not match production:%s\n\nA harness on a schema production does not have proves nothing. Fix the fixture, or refresh tests/sql/production_columns.snapshot.sql deliberately and date it.', v_msg;
  end if;
  raise notice 'PASS schema parity: every fixture column matches the production snapshot';
end $$;
